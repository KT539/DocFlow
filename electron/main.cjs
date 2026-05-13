/**
 * @file            electron/main.js
 * @project         DocFlow
 * @author          Kilian Testard
 * @project_lead    Pascal Hurni
 * @last_modified   12-05-2026
 */


const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const { spawn, execSync } = require('child_process');
const chokidar = require('chokidar');


let phpServer;
let watchers = {};
let isConverting = false;
let conversionQueue = [];

// launch PHP's integrated dev server on port 8000, directed to the backend/ folder
function startPhpServer() {
  phpServer = spawn('php', ['-S', 'localhost:8000', '-t', path.join(__dirname, '../backend')]);
  // event listeners on PHP server data and errors
  phpServer.stdout.on('data', (data) => console.log(`PHP: ${data}`));
  phpServer.stderr.on('data', (data) => console.error(`PHP Error: ${data}`));
}

// creates the main app window with IPC security enabled and loads the React app from Vite's dev server
function createWindow() {
  const win = new BrowserWindow({
    width: 1300,
    height: 800,
    minWidth: 1000, // sets up a minimal width and height
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false, // disables the renderer's direct access to Node.js
      contextIsolation: true, // isolates the renderer for better security
      preload: path.join(__dirname, 'preload.cjs') // only bridge between main and renderer processes
    }
  });

  win.removeMenu();
  win.loadURL('http://localhost:5173'); // loads the React app served by Vite
};


// handles the 'select-directory' IPC call : opens the windows file explorer and returns the selected path
ipcMain.handle('select-directory', async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  if (result.canceled) {
    return null; // returns null if the user closed the dialog without selecting
  } else {
    return result.filePaths[0]; // returns the selected folder path
  }
});


// checks the user's environment before launching
function checkEnvironment() {
  if (process.platform !== 'win32') {
      dialog.showErrorBox('Système non supporté', 'DocFlow ne fonctionne que sur Windows.');
      app.quit();
      return false;
  }

  // checks that PHP is installed and in the PATH
  try {
    execSync('php -v');
  } catch (err) {
    dialog.showErrorBox('PHP introuvable', 'L\'interpréteur PHP n\'est pas installé ou n\'est pas dans le PATH. Veuillez l\'installer avant d\'utiliser DocFlow.');
    app.quit();
    return false;
  }

  try {
      // tries to get the location of the Word/Excel executable in he registry ; !! from AI !!
      execSync('reg query "HKEY_CLASSES_ROOT\\Word.Application"');
      execSync('reg query "HKEY_CLASSES_ROOT\\Excel.Application"');
      return true;
  } catch (err) {
      dialog.showErrorBox('Microsoft Office introuvable', 'DocFlow a besoin de Word et de Excel pour fonctionner. Veuillez installer Office et réessayer.');
      app.quit();
      return false;
  }
}


async function convQueue() {
  if (isConverting || conversionQueue.length === 0) {
      return;
  }

  isConverting = true;
  const task = conversionQueue.shift(); // shift() takes the first element out of the array and returns it

  try {
      console.log(`Conversion de : ${task.fileName}`); // for dev purposes
      const res = await fetch(`http://localhost:8000/convert.php?id=${task.flowId}&filename=${encodeURIComponent(task.fileName)}&trigger_type=AUTO`);
      const data = await res.json();
      console.log(`Terminé : ${task.fileName}`, data.status);
  } catch (err) {
      console.error(`Error : ${task.fileName}`, err);
  }

  isConverting = false; // resets the variable
  convQueue(); // recursive call to the function until the queue is empty
}


// written by me, but with some help from AI to understand how chokidar works
async function setupAutoTriggers() {
    try {
        const res = await fetch(`http://localhost:8000/api/flows.php`); // gets the flows
        const flows = await res.json();
        const autoFlows = Array.isArray(flows) ? flows.filter(f => f.auto_trigger === 1) : []; // if a flows array is returned, filter those with auto_trigger
      
        // used an object instead of an array an AI's suggestion
        Object.values(watchers).forEach(w => w.close()); // closes any instance of the watchers object, to make sure two instances don't overlap on the same folder in case of flow modification
        watchers = {}; // then resets the object

        autoFlows.forEach(flow => {
            console.log(`Watching : ${flow.source_dir} for Flow : ${flow.name}`); // for dev purposes

            const watcher = chokidar.watch(flow.source_dir, { // for each flow, chokidar watches the source dir
                persistent: true, // keeps running as long as the app is running
                ignoreInitial: true, // ignores the files that are already in the folder at launch
                depth: 0, // only watches the root folder
                awaitWriteFinish: true // ensures chokidar doesn't start processing a big file while it is still being copied ; suggesion from AI
            });

            watcher.on('add', async (filePath) => { // triggers on the 'add' event, whenever a file is added to the folder
                // security limit to the queue
                if (conversionQueue.length >= 500) {  
                  // with help from AI
                    const win = BrowserWindow.getAllWindows()[0]; // gets the main (and only) window ; electron can manage multiple windows
                    if (win) {
                        win.webContents.send('queue-error', "File d'attente saturée (1000+ fichiers). Veuillez vider la file d'attente."); // sends the error message on the queue-error "canal"
                    }
                    return;
                }
              
                // uses path.extname() method to get the new file's extension and check if the file format is valid + activated in the flow
                const extension = path.extname(filePath).toLowerCase();
                const isDocx = extension === '.docx' && flow.convert_docx;
                const isXlsx = extension === '.xlsx' && flow.convert_xlsx;
          
                // uses the path-basename() method to get the new file's name
                if (isDocx || isXlsx) {
                    const fileName = path.basename(filePath);
                    console.log(`Auto-trigger: Nouveau fichier détecté : ${fileName}`); // for dev purposes

                    // adds the new file to the queue and calls convQueue()
                    conversionQueue.push({ flowId: flow.id, fileName: fileName });
                    convQueue();
                }
            });

            watchers[flow.id] = watcher; // stores the watcher in the watchers object, with its flow_id as the key
        });
    } catch (err) {
      console.error("Erreur d'initialisation des watchers : ", err);
    }
}


ipcMain.on('clear-queue', () => { // triggers on receiving the send() from the renderer
  console.log("File d'attente vidée par l'utilisateur"); // for dev purposes
  conversionQueue = []; // empties the queue
});

// sends the queue legnth to the renderer on a short interval ; with help from AI
setInterval(() => {
  const win = BrowserWindow.getAllWindows()[0]; 
  if (win) {
    win.webContents.send('queue-status', conversionQueue.length); // sends the queue length on the queue-status "canal"
  }
}, 100);


// triggers once electron is initialized
app.whenReady().then(() => {
  if (!checkEnvironment()) { // checks the user's environment first
    return;
  }
  try {
    execSync(`php ${path.join(__dirname, '../backend/db_init.php')}`); // execSync blocks the execution until the db initialization is complete
    startPhpServer();
    setTimeout(setupAutoTriggers, 1000); // timeout to be sure the PHP server is ready before loading the watchers, suggestion from AI
    createWindow();
  } catch (err) {
    console.error("Erreur d'initialisation : ", err); // for dev purposes
  }
});

// listens to the renderer process in case the watchers are refreshed (user creating/modifiying an auto Flow)
ipcMain.on('refresh-watchers', () => {
  console.log("Refresh des watchers..."); // to be replaced by another log
  setupAutoTriggers(); // loads the watchers again in case of a refresh
});

// triggers when all windows are closed
app.on('window-all-closed', () => {
  if (phpServer) phpServer.kill(); // terminates the PHP process so it doesn't keep running in the background
  if (process.platform !== 'darwin') app.quit(); // electron convention for macOS ; !! from AI !!
});