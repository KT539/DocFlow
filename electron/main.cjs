/**
 * @file            electron/main.js
 * @project         DocFlow
 * @author          Kilian Testard
 * @project_lead    Pascal Hurni
 * @last_modified   07-05-2026
 */


const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const { spawn, execSync } = require('child_process');
const chokidar = require('chokidar');


let phpServer;
let watchers = {};

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


// written by me, but with some help from AI to understand how chokidar works
async function setupAutoTriggers() {
  try {
    const res = await fetch(`http://localhost:8000/api/flows.php`);
    const flows = await res.json();
    const autoFlows = Array.isArray(flows) ? flows.filter(f => f.auto_trigger === 1) : []; // if a flows array is returned, filter those with auto_trigger
    
    Object.values(watchers).forEach(w => w.close());
    watchers = {};

    autoFlows.forEach(flow => {
      console.log(`Watching : ${flow.source_dir} for Flow : ${flow.name}`); // to be replaced by another log

      const watcher = chokidar.watch(flow.source_dir, {
        persistent: true,
        ignoreInitial: true, // ignores the files that are already in the folder at launch
        depth: 0, // only watches the root folder
        awaitWriteFinish: true // ensures chokidar doesn't start processing a big file while it is still being copied ; suggesion from AI
      });

      watcher.on('add', (filePath) => {
        const extension = path.extname(filePath).toLowerCase();
        const isDocx = extension === '.docx' && flow.convert_docx;
        const isXlsx = extension === '.xlsx' && flow.convert_xslx;
        
        if (isDocx || isXlsx) {
          const fileName = path.basename(filePath);
          console.log(`Auto-trigger: Nouveau fichier détecté : ${fileName}`); // to be replaced by another log

          // !! from AI, to be replaced !!
          fetch(`http://localhost:8000/convert.php?id=${flow.id}&filename=${encodeURIComponent(fileName)}`)
            .then(res => res.json())
            .then(data => console.log(`Auto-conversion terminée pour ${fileName}:`, data.status))
            .catch(err => console.error(`Erreur auto-trigger pour ${fileName}:`, err));

        }
      });
      watchers[flow.id] = watcher;
    });
  } catch (err) {
    console.error("Erreur lors de l'initialisation des watchers:", err);
  }
};


// triggers once electron is initialized
app.whenReady().then(() => {
  execSync(`php ${path.join(__dirname, '../backend/db_init.php')}`); // execSync blocks the execution until the db initialization is complete
  startPhpServer();
  setTimeout(setupAutoTriggers, 1000); // timeout to be sure the PHP server is ready before loading the watchers
  createWindow();
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