/**
 * Utility functions for platform awareness (Browser vs Electron Desktop)
 */

export interface ElectronAPI {
  isElectron: boolean;
  getPlatform: () => Promise<string>;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export const isElectron = (): boolean => {
  return typeof window !== 'undefined' && Boolean(window.electronAPI?.isElectron);
};

export const getElectronPlatform = async (): Promise<string | null> => {
  if (!isElectron() || !window.electronAPI) return null;
  try {
    return await window.electronAPI.getPlatform();
  } catch (err) {
    console.error('Failed to get platform from Electron API:', err);
    return null;
  }
};

export const minimizeWindow = () => {
  if (isElectron() && window.electronAPI) {
    window.electronAPI.minimize();
  }
};

export const maximizeWindow = () => {
  if (isElectron() && window.electronAPI) {
    window.electronAPI.maximize();
  }
};

export const closeWindow = () => {
  if (isElectron() && window.electronAPI) {
    window.electronAPI.close();
  }
};
