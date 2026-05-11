/**
 * @file            electron/preload.cjs
 * @project         DocFlow
 * @author          Kilian Testard
 * @project_lead    Pascal Hurni
 * @last_modified   04-05-2026
 */


/* acts as the sole secure bridge between the main process (Node.js)
and the renderer process (Chromium+React), avoiding direct Node.js access from the renderer */

const { contextBridge, ipcRenderer } = require('electron');

// contextBridge allows to create window.electronAPI objects, making them accessible from the renderer without exposing ipcRenderer itself
contextBridge.exposeInMainWorld('electronAPI', {
    selectDirectory: () => ipcRenderer.invoke('select-directory'),
    refreshWatchers: () => ipcRenderer.send('refresh-watchers') // uses .send() instead of .invoke(), as the renderer doesn't need an answer from the main process
});