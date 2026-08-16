import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
  isElectron: boolean;
  getPlatform: () => Promise<string>;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
}

const electronAPI: ElectronAPI = {
  isElectron: true,
  getPlatform: () => ipcRenderer.invoke('electron:get-platform'),
  minimize: () => ipcRenderer.send('electron:window-minimize'),
  maximize: () => ipcRenderer.send('electron:window-maximize'),
  close: () => ipcRenderer.send('electron:window-close'),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
