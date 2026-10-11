'use strict';

const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { app, BrowserWindow, protocol, net, dialog, shell, session } = require('electron');
const { resolveGameAsset } = require('./protocol.cjs');

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'everafter',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true
    }
  }
]);

app.setName('EverAfter');
if (process.platform === 'win32') app.setAppUserModelId('com.everafter.desktop');

let mainWindow;
const hasInstanceLock = app.requestSingleInstanceLock();
if (!hasInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });

  app.whenReady().then(() => {
    const gameRoot = path.join(__dirname, 'game');
    // A stable, secure local origin keeps localStorage saves working across installer updates.
    protocol.handle('everafter', request => {
      const resolved = resolveGameAsset(gameRoot, request.url);
      if (!resolved) return new Response('Not found', { status: 404 });
      return net.fetch(pathToFileURL(resolved).toString());
    });

    session.defaultSession.setPermissionRequestHandler((_webContents, _permission, answer) => answer(false));

    mainWindow = new BrowserWindow({
      title: 'EverAfter',
      width: 1320,
      height: 850,
      minWidth: 820,
      minHeight: 580,
      center: true,
      backgroundColor: '#0b0b19',
      icon: path.join(__dirname, 'build-resources', 'icon.ico'),
      autoHideMenuBar: true,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webSecurity: true,
        spellcheck: false
      }
    });

    const openExternal = url => {
      try {
        const parsed = new URL(url);
        if (parsed.protocol === 'https:' || parsed.protocol === 'http:') void shell.openExternal(url);
      } catch { /* Invalid external URLs are ignored. */ }
    };

    mainWindow.webContents.on('will-navigate', (event, url) => {
      if (url.startsWith('everafter://game/')) return;
      event.preventDefault();
      openExternal(url);
    });
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      openExternal(url);
      return { action: 'deny' };
    });

    // "Export save" in the existing HTML writes a JSON file chosen by the player.
    session.defaultSession.on('will-download', (event, item, webContents) => {
      if (!mainWindow || webContents.id !== mainWindow.webContents.id) return;
      const suggested = path.basename(item.getFilename() || 'everafter-save.json');
      const destination = dialog.showSaveDialogSync(mainWindow, {
        title: 'Export EverAfter save',
        defaultPath: path.join(app.getPath('downloads'), suggested),
        filters: [{ name: 'JSON save files', extensions: ['json'] }]
      });
      if (!destination) item.cancel();
      else item.setSavePath(destination);
    });

    mainWindow.once('ready-to-show', () => mainWindow?.show());
    void mainWindow.loadURL('everafter://game/index.html');
    mainWindow.on('closed', () => { mainWindow = null; });
  });

  app.on('activate', () => {
    if (mainWindow) mainWindow.show();
  });
}
app.on('window-all-closed', () => app.quit());
