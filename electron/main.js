/**
 * @file            main.js
 * @project         DocFlow
 * @author          Kilian Testard
 * @project_lead    Pascal Hurni
 * @last_modified   27-04-2026
 */


import { app, BrowserWindow, dialog, ipcMain} from 'electron'; // import the needed electron modules
import path from 'path'; // native Node module to handle file paths cross-platform
import  { fileURLToPath } from 'url';
import { spawn } from 'child_process'; // native Node module to launch external processes from the app, like my PHP server


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    width: 1100,
    height: 750,
    webPreferences: {
      nodeIntegration: false, // disable the renderer's direct access to Node.js
      contextIsolation: true, // isolate the renderer for better security
      preload: path.join(__dirname, 'preload.js') // runs preload.js before the renderer
    }
  });

  win.loadURL('http://localhost:5173'); // load the React app served by Vite
}


// triggers once electron is initialized : start the PHP server, then create a window
app.whenReady().then(() => {
  startPhpServer();
  createWindow();
});

// triggers when all windows are closed
app.on('window-all-closed', () => {
  if (phpServer) phpServer.kill(); // terminate the PHP process so it doesn't keep running in the background
  if (process.platform !== 'darwin') app.quit(); // electron convention for macOS ; !! help from AI !!
});