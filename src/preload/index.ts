import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  enterFullScreen: () => ipcRenderer.invoke('window:enterFullScreen'),
});

contextBridge.exposeInMainWorld('botControl', {
  getState: () => ipcRenderer.invoke('bot:getState'),
  setState: (patch: Record<string, unknown>) =>
    ipcRenderer.invoke('bot:setState', patch),
  getStatus: () => ipcRenderer.invoke('bot:getStatus'),
  debugDOM: () => ipcRenderer.invoke('bot:debugDOM'),
  debugScan: () => ipcRenderer.invoke('bot:debugScan'),
  checkSelectors: () => ipcRenderer.invoke('bot:checkSelectors'),
  getArchetypes: () => ipcRenderer.invoke('bot:getArchetypes'),
  getAesthetics: () => ipcRenderer.invoke('bot:getAesthetics'),
  getExampleCharacters: () => ipcRenderer.invoke('bot:getExampleCharacters'),
  getCharacterConfig: (userId: string | null) =>
    ipcRenderer.invoke('bot:getCharacterConfig', userId),
  setCharacterConfig: (
    userId: string | null,
    config: { archetypeId: string; aestheticId: string } | null,
    enabled?: boolean
  ) => ipcRenderer.invoke('bot:setCharacterConfig', { userId, config, enabled }),
});

contextBridge.exposeInMainWorld('snapbot', {
  show: () => ipcRenderer.invoke('snapbot:show'),
  hide: () => ipcRenderer.invoke('snapbot:hide'),
  setBounds: (x: number, y: number, width: number, height: number) =>
    ipcRenderer.invoke('snapbot:setBounds', { x, y, width, height }),
});
