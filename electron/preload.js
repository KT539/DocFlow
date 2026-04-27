/**
 * @file            electron/preload.js
 * @project         DocFlow
 * @author          Kilian Testard
 * @project_lead    Pascal Hurni
 * @last_modified   27-04-2026
 */


/* acts as the sole secure bridge between the main process (Node.js)
and the renderer process (Chromium+React), avoiding direct Node.js access from the renderer */

// import the ipcRenderer object, and the contextBridge module which allows to safely expose functions to the renderer
import { contextBridge, ipcRenderer } from 'electron';

// creates the window.electronAPI object, making it accessible from the renderer
contextBridge.exposeInMainWorld('electronAPI', {
});