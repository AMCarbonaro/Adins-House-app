import 'dotenv/config';
import { app, BrowserWindow, BrowserView, ipcMain, nativeImage, globalShortcut, screen } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { botState } from './bot-state';
import { startBot, stopBot } from './bot';
import {
  getCharacterData as getStoredCharacterData,
  setCharacterData as setStoredCharacterData,
} from './character-store';
import { ARCHETYPES, AESTHETICS, EXAMPLE_CHARACTERS } from './characters';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

app.setName('Step Bro');

// Reduce chance Snapchat detects automation
app.commandLine.appendSwitch('disable-blink-features', 'AutomationControlled');
app.commandLine.appendSwitch(
  'disable-features',
  'IsolateOrigins,site-per-process'
);

const SNAPCHAT_UA =
  process.platform === 'darwin'
    ? 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const RELOAD_INTERVAL = 1.5 * 60 * 60 * 1000; // 1h30m

let mainWindow: BrowserWindow | null = null;
let snapchatView: BrowserView | null = null;
let reloadTimer: ReturnType<typeof setInterval> | null = null;

function createWindow(): void {
  const preloadPath = path.join(__dirname, '../preload/index.mjs');
  const iconPath = isDev
    ? path.join(process.cwd(), 'build', 'icon.png')
    : path.join(process.resourcesPath, 'icon.png');
  const icon = nativeImage.createFromPath(iconPath);

  const primaryDisplay = screen.getPrimaryDisplay();
  const workArea = primaryDisplay.workArea;
  const screenWidth = workArea.width;
  const screenHeight = workArea.height;
  const scale = 0.9;
  const width = Math.max(900, Math.round(screenWidth * scale));
  const height = Math.max(600, Math.round(screenHeight * scale));
  const x = workArea.x + Math.round((screenWidth - width) / 2);
  const y = workArea.y + Math.round((screenHeight - height) / 2);

  mainWindow = new BrowserWindow({
    title: 'Step Bro',
    icon: icon.isEmpty() ? undefined : icon,
    width,
    height,
    x,
    y,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#11111b',
    show: false,
  });

  if (isDev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    if (!icon.isEmpty() && process.platform === 'darwin') app.dock?.setIcon(icon);
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    hideSnapchatView();
  });
}

function showSnapchatView(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (snapchatView && !snapchatView.webContents.isDestroyed()) return;

  snapchatView = new BrowserView({
    webPreferences: {
      partition: 'persist:snapchat',
      nodeIntegration: false,
    },
  });

  snapchatView.webContents.setUserAgent(SNAPCHAT_UA);
  snapchatView.webContents.session.setPermissionRequestHandler(() => {});

  snapchatView.webContents.on('dom-ready', () => {
    try {
      const css = `*::-webkit-scrollbar{display:none!important}button,input[type="submit"],input[type="button"],[role="button"],a[href]:not([href=""]){pointer-events:auto!important;position:relative;z-index:2}`;
      snapchatView?.webContents.insertCSS(css);
    } catch {
      // CSS injection optional
    }
    try {
      startBot(snapchatView!.webContents);
    } catch (e) {
      console.error('Bot failed to start:', e);
    }
  });

  mainWindow.setBrowserView(snapchatView);
  snapchatView.setBounds({ x: 0, y: 0, width: 800, height: 600 });
  snapchatView.webContents.loadURL('https://www.snapchat.com');

  reloadTimer = setInterval(() => {
    if (snapchatView && !snapchatView.webContents.isDestroyed()) {
      snapchatView.webContents.reload();
    }
  }, RELOAD_INTERVAL);
}

function hideSnapchatView(): void {
  if (reloadTimer) {
    clearInterval(reloadTimer);
    reloadTimer = null;
  }
  stopBot();
  botState.lastStatus.connected = false;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setBrowserView(null);
  }
  if (snapchatView) {
    if (!snapchatView.webContents.isDestroyed()) {
      snapchatView.webContents.destroy();
    }
    snapchatView = null;
  }
}

function setSnapchatViewBounds(
  x: number,
  y: number,
  width: number,
  height: number
): void {
  if (snapchatView && !snapchatView.webContents.isDestroyed()) {
    snapchatView.setBounds({ x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) });
  }
}

app.whenReady().then(() => {
  ipcMain.handle('bot:getState', () => ({
    enabled: botState.enabled,
    selectedChats: botState.selectedChats,
    newChatReply: botState.newChatReply,
    newSnapAction: botState.newSnapAction,
    characterConfig: botState.characterConfig,
    characterEnabled: botState.characterEnabled,
    selectors: botState.selectors,
  }));

  ipcMain.handle('bot:getArchetypes', () => ARCHETYPES);
  ipcMain.handle('bot:getAesthetics', () => AESTHETICS);
  ipcMain.handle('bot:getExampleCharacters', () =>
    EXAMPLE_CHARACTERS.map((c) => ({
      name: c.name,
      description: c.description,
      archetypeId: c.archetype.id,
      aestheticId: c.aesthetic.id,
    }))
  );

  ipcMain.handle('bot:getCharacterConfig', (_, userId: string | null) => {
    const data = userId ? getStoredCharacterData(userId) : null;
    return {
      config: data?.config ?? botState.characterConfig,
      enabled: data?.enabled ?? botState.characterEnabled,
    };
  });

  ipcMain.handle(
    'bot:setCharacterConfig',
    (
      _,
      {
        userId,
        config,
        enabled,
      }: {
        userId: string | null;
        config: { archetypeId: string; aestheticId: string } | null;
        enabled?: boolean;
      }
    ) => {
      if (userId) {
        setStoredCharacterData(userId, {
          config: config ?? undefined,
          enabled: enabled ?? undefined,
        });
      }
      if (config !== undefined) botState.characterConfig = config;
      if (enabled !== undefined) botState.characterEnabled = enabled;
    }
  );

  ipcMain.handle(
    'bot:setState',
    (
      _,
      patch: {
        enabled?: boolean;
        selectedChats?: typeof botState.selectedChats;
        newChatReply?: string;
        newSnapAction?: string;
        characterConfig?: typeof botState.characterConfig;
        characterEnabled?: boolean;
        selectors?: typeof botState.selectors;
      }
    ) => {
      if (patch.enabled !== undefined) botState.enabled = patch.enabled;
      if (patch.selectedChats) botState.selectedChats = patch.selectedChats;
      if (patch.newChatReply !== undefined)
        botState.newChatReply = patch.newChatReply;
      if (patch.newSnapAction !== undefined)
        botState.newSnapAction = patch.newSnapAction;
      if (patch.characterConfig !== undefined)
        botState.characterConfig = patch.characterConfig;
      if (patch.characterEnabled !== undefined)
        botState.characterEnabled = patch.characterEnabled;
      if (patch.selectors) Object.assign(botState.selectors, patch.selectors);
    }
  );

  ipcMain.handle('bot:getStatus', () => ({ ...botState.lastStatus }));

  ipcMain.handle('window:enterFullScreen', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setFullScreen(true);
    }
  });

  ipcMain.handle('snapbot:show', () => {
    showSnapchatView();
    return true;
  });

  ipcMain.handle('snapbot:hide', () => {
    hideSnapchatView();
    return true;
  });

  ipcMain.handle(
    'snapbot:setBounds',
    (
      _,
      bounds: { x: number; y: number; width: number; height: number }
    ) => {
      setSnapchatViewBounds(
        bounds.x,
        bounds.y,
        bounds.width,
        bounds.height
      );
    }
  );

  createWindow();

  // Cmd+R / Ctrl+R to refresh the main window
  globalShortcut.register(process.platform === 'darwin' ? 'Command+R' : 'Control+R', () => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.reload();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  hideSnapchatView();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
