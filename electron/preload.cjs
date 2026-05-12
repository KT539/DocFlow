/**
 * @file            electron/preload.cjs
 * @project         DocFlow
 * @author          Kilian Testard
 * @project_lead    Pascal Hurni
 * @last_modified   12-05-2026
 */


/* acts as the sole secure bridge between the main process (Node.js)
and the renderer process (Chromium+React), avoiding direct Node.js access from the renderer */

const { contextBridge, ipcRenderer } = require('electron');

// contextBridge allows to create window.electronAPI objects, making them accessible from the renderer without exposing ipcRenderer itself
contextBridge.exposeInMainWorld('electronAPI', {
    selectDirectory: () => ipcRenderer.invoke('select-directory'),
    refreshWatchers: () => ipcRenderer.send('refresh-watchers'), // uses .send() instead of .invoke(), as the renderer doesn't need an answer from the main process
    clearQueue: () => ipcRenderer.send('clear-queue'),
    // callback functions
    onQueueUpdate: (callback) => {
        ipcRenderer.removeAllListeners('queue-status'); // cleans up the old listener before opening a new one
        ipcRenderer.on('queue-status', (event, count) => callback(count)); // listens to the queue-status "canal" ; receives count from the main, and makes it availbale to the renderer
    },
    onQueueError: (callback) => {
        ipcRenderer.removeAllListeners('queue-error');
        ipcRenderer.on('queue-error', (event, message) => callback(message));
    }
});