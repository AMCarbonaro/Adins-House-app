import 'dotenv/config';
import { app, BrowserWindow, BrowserView, ipcMain, nativeImage, globalShortcut, screen } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { botState } from './bot-state';
import { startBot, stopBot, resetPreload } from './bot';
import fs from 'fs';
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
  // Load persisted API key
  try {
    const keyPath = path.join(app.getPath('userData'), 'groq-key.txt');
    if (fs.existsSync(keyPath)) {
      botState.groqApiKey = fs.readFileSync(keyPath, 'utf-8').trim();
    }
  } catch {}

  ipcMain.handle('bot:getState', () => ({
    enabled: botState.enabled,
    selectedChats: botState.selectedChats,
    newChatReply: botState.newChatReply,
    newSnapAction: botState.newSnapAction,
    characterConfig: botState.characterConfig,
    characterEnabled: botState.characterEnabled,
    selectors: botState.selectors,
    groqApiKey: botState.groqApiKey,
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
        groqApiKey?: string;
      }
    ) => {
      if (patch.groqApiKey !== undefined) {
        botState.groqApiKey = patch.groqApiKey;
        // Persist to disk
        try {
          const keyPath = path.join(app.getPath('userData'), 'groq-key.txt');
          fs.writeFileSync(keyPath, patch.groqApiKey, 'utf-8');
        } catch {}
      }
      if (patch.enabled !== undefined) botState.enabled = patch.enabled;
      if (patch.selectedChats) {
        botState.selectedChats = patch.selectedChats;
        resetPreload(); // re-scroll on next cycle to load new range
      }
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

  ipcMain.handle('bot:debugScan', async () => {
    if (!snapchatView || snapchatView.webContents.isDestroyed()) return { error: 'no view' };
    return snapchatView.webContents.executeJavaScript(`
(function() {
  try {
    var feed = document.querySelector('div[aria-label="Friends Feed"]');
    var listSel = '.ReactVirtualized__Grid.ReactVirtualized__List, .ReactVirtualized_Grid.ReactVirtualized_List, [role="list"]';
    var parts = listSel.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
    var vList = null;
    if (feed) {
      for (var i = 0; i < parts.length; i++) { vList = feed.querySelector(parts[i]); if (vList) break; }
    }
    if (!vList) {
      for (var j = 0; j < parts.length; j++) { vList = document.querySelector(parts[j]); if (vList) break; }
    }
    if (!vList) return { ok: false, error: 'no list element found', tried: ['Friends Feed + ' + listSel] };
    var items = vList.querySelectorAll('[role="listitem"]');
    var totalListitems = items.length;
    var details = [];
    var filtered = [];
    for (var i = 0; i < Math.min(items.length, 25); i++) {
      var el = items[i];
      var text = (el.textContent || '').trim().slice(0, 60);
      var rect = el.getBoundingClientRect();
      var parent = el.parentElement;
      var parentFlex = parent ? window.getComputedStyle(parent).flexDirection : 'n/a';
      var parentOverflowX = parent ? window.getComputedStyle(parent).overflowX : 'n/a';
      var parentClass = (parent?.className || '').slice(0, 80);
      var ariaLabel = el.getAttribute('aria-label') || '';
      var skipSmall = (rect.width > 0 && rect.height > 0 && rect.width < 120 && rect.height < 120);
      var skipFlex = (parentFlex === 'row');
      var skipStory = (ariaLabel.toLowerCase().indexOf('story') >= 0);
      var skipped = skipSmall || skipFlex || skipStory;
      details.push({
        i: i, text: text.slice(0, 40), w: Math.round(rect.width), h: Math.round(rect.height),
        parentFlex: parentFlex, parentOverflowX: parentOverflowX, parentClass: parentClass.slice(0, 40),
        ariaLabel: ariaLabel.slice(0, 30), skipSmall: skipSmall, skipFlex: skipFlex, skipStory: skipStory, skipped: skipped
      });
      if (!skipped) filtered.push(text);
    }
    return { ok: true, totalListitems: totalListitems, afterFilter: filtered.length, details: details, filtered: filtered };
  } catch(e) { return { ok: false, error: e.message }; }
})();
    `);
  });

  ipcMain.handle('bot:debugDOM', async () => {
    if (!snapchatView || snapchatView.webContents.isDestroyed()) return { error: 'no view' };
    return snapchatView.webContents.executeJavaScript(`
(function() {
  try {
    var results = {};
    // Check what role="list" elements exist
    var lists = document.querySelectorAll('[role="list"]');
    results.roleLists = lists.length;
    results.roleListDetails = [];
    for (var i = 0; i < Math.min(lists.length, 5); i++) {
      var l = lists[i];
      var items = l.querySelectorAll('[role="listitem"]');
      results.roleListDetails.push({
        tag: l.tagName,
        classes: l.className.slice(0, 100),
        childCount: l.children.length,
        listitemCount: items.length,
        parentClasses: (l.parentElement?.className || '').slice(0, 100),
        sampleText: (l.textContent || '').slice(0, 200)
      });
    }
    // Check for common chat list patterns
    results.divLists = document.querySelectorAll('div[role="list"]').length;
    results.ulElements = document.querySelectorAll('ul').length;
    results.navElements = document.querySelectorAll('nav').length;
    // Look for anything that looks like a chat list
    var allDivs = document.querySelectorAll('div');
    var tallDivs = [];
    for (var d = 0; d < allDivs.length; d++) {
      if (allDivs[d].children.length > 5 && allDivs[d].scrollHeight > 500) {
        tallDivs.push({
          tag: allDivs[d].tagName,
          classes: allDivs[d].className.slice(0, 100),
          childCount: allDivs[d].children.length,
          scrollH: allDivs[d].scrollHeight,
          firstChildTag: allDivs[d].children[0]?.tagName,
          firstChildClasses: (allDivs[d].children[0]?.className || '').slice(0, 80),
          firstChildText: (allDivs[d].children[0]?.textContent || '').slice(0, 60)
        });
      }
      if (tallDivs.length >= 10) break;
    }
    results.tallDivs = tallDivs;
    results.url = window.location.href;
    return results;
  } catch(e) { return { error: e.message }; }
})();
    `);
  });

  ipcMain.handle('bot:checkSelectors', async () => {
    if (!snapchatView || snapchatView.webContents.isDestroyed()) return { error: 'no view' };
    const s = botState.selectors;
    const chatListParts = (s.chatList || 'div[aria-label="Friends Feed"],[role="list"]').split(',').map((x) => x.trim()).filter(Boolean);
    const chatItem = s.chatItem || '[role="listitem"]';
    const inputParts = (s.inputBox || '').split(',').map((x) => x.trim()).filter(Boolean);
    const sendParts = (s.sendButton || '').split(',').map((x) => x.trim()).filter(Boolean);
    const portal = s.portal || '#portal-container';
    const searchParts = (s.searchInput || '').split(',').map((x) => x.trim()).filter(Boolean);
    const msgListParts = (s.messageList || 'ul.ujRzj').split(',').map((x) => x.trim()).filter(Boolean);
    const payload = {
      chatListParts,
      chatItem,
      inputParts,
      sendParts,
      portal,
      searchParts,
      msgListParts,
    };
    const payloadStr = JSON.stringify(payload);
    return snapchatView.webContents.executeJavaScript(`
(function() {
  try {
    var p = JSON.parse(${JSON.stringify(payloadStr)});
    var root = document.querySelector(p.portal) || document.body;
    var list = null;
    for (var i = 0; i < p.chatListParts.length; i++) {
      list = document.querySelector(p.chatListParts[i]);
      if (list) break;
    }
    var chatList = !!list;
    var chatItemCount = list ? list.querySelectorAll(p.chatItem).length : 0;
    var input = false;
    for (var j = 0; j < p.inputParts.length; j++) {
      if (root.querySelector(p.inputParts[j]) || document.querySelector(p.inputParts[j])) { input = true; break; }
    }
    var send = false;
    for (var k = 0; k < p.sendParts.length; k++) {
      if (root.querySelector(p.sendParts[k]) || document.querySelector(p.sendParts[k])) { send = true; break; }
    }
    var search = false;
    for (var q = 0; q < p.searchParts.length; q++) {
      if (document.querySelector(p.searchParts[q])) { search = true; break; }
    }
    var messageList = false;
    for (var m = 0; m < p.msgListParts.length; m++) {
      if (document.querySelector(p.msgListParts[m])) { messageList = true; break; }
    }
    if (!messageList) messageList = document.querySelectorAll('ul').length > 0;
    return { ok: true, chatList, chatItemCount, input, send, search, messageList };
  } catch (e) { return { ok: false, error: e.message }; }
})();
    `);
  });

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
