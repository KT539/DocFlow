/**
 * @file            electron/main.js
 * @project         DocFlow
 * @author          Kilian Testard
 * @project_lead    Pascal Hurni
 * @last_modified   27-04-2026
 */


const { app, BrowserWindow, dialog, ipcMain } = require('electron'); // import the needed electron modules
const path = require('path'); // native Node module to handle file paths cross-platform
const { spawn, execSync } = require('child_process'); // spawn is a native Node module to launch external processes from the app, like my PHP server


let phpServer;

// launch PHP's integrated dev server on port 8000, directed to the backend/ folder
function startPhpServer() {
  phpServer = spawn('php', ['-S', 'localhost:8000', '-t', path.join(__dirname, '../backend')]);
  // event listeners on PHP server data and errors
  phpServer.stdout.on('data', (data) => console.log(`PHP: ${data}`));
  phpServer.stderr.on('data', (data) => console.error(`PHP Error: ${data}`));
}

// creates the main app window with IPC security enabled and load the React app from Vite's dev server
function createWindow() {
  const win = new BrowserWindow({
    width: 1300,
    height: 800,
    webPreferences: {
      nodeIntegration: false, // disable the renderer's direct access to Node.js
      contextIsolation: true, // isolate the renderer for better security
      preload: path.join(__dirname, 'preload.cjs') // runs preload.cjs before the renderer
    }
  });

  win.loadURL('http://localhost:5173'); // load the React app served by Vite
};


// handles the 'select-directory' IPC call : opens the windows file explorer and returns the selected path
ipcMain.handle('select-directory', async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  if (result.canceled) {
    return null; // return null if the user closed the dialog without selecting
  } else {
    return result.filePaths[0]; // return the selected folder path
  }
});


// triggers once electron is initialized : start the PHP server, then create a window
app.whenReady().then(() => {
  execSync(`php ${path.join(__dirname, '../backend/db_init.php')}`); // initalize the db
  startPhpServer();
  createWindow();
});

// triggers when all windows are closed
app.on('window-all-closed', () => {
  if (phpServer) phpServer.kill(); // terminate the PHP process so it doesn't keep running in the background
  if (process.platform !== 'darwin') app.quit(); // electron convention for macOS ; !! help from AI !!
});