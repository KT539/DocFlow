/**
 * @file            electron/main.js
 * @project         DocFlow
 * @author          Kilian Testard
 * @project_lead    Pascal Hurni
 * @last_modified   04-05-2026
 */


const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const { spawn, execSync } = require('child_process');


let phpServer;

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


// triggers once electron is initialized
app.whenReady().then(() => {
  execSync(`php ${path.join(__dirname, '../backend/db_init.php')}`); // execSync blocks the execution until the db initialization is complete
  startPhpServer();
  createWindow();
});

// triggers when all windows are closed
app.on('window-all-closed', () => {
  if (phpServer) phpServer.kill(); // terminates the PHP process so it doesn't keep running in the background
  if (process.platform !== 'darwin') app.quit(); // electron convention for macOS ; !! from AI !!
});