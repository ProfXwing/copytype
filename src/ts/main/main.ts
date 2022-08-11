import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron';
import * as path from 'path';
import { createBook, deleteBook } from './library';
import * as fs from 'fs';
import { exec } from "child_process";
import electronReload from 'electron-reload';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

console.log(process.argv);
const root = path.join(__dirname, "../../../");

if (app.isPackaged == false) {
  electronReload(root, {
    electron: path.join(root, "node_modules", ".bin", "electron"),
    hardResetMethod: 'exit'
  });
}

const createWindow = (): void => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    autoHideMenuBar: true
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, '../../../src/index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  mainWindow.on("close", event => {
    mainWindow.webContents.send('save-and-close');
    event.preventDefault();
  });

  ipcMain.on('create-book', async (event) => {
    const dir = await createBook(event);
    if (dir) {
      event.sender.send('load-book', dir);
    }
  })

  ipcMain.on('warn-delete-book', async (event, bookId, bookTitle) => {
    event.sender.send("warn-delete-book", bookId, bookTitle);
  })

  ipcMain.on('delete-book', async (event, bookName) => {
    deleteBook(event, bookName);
  })

  // I am very aware that I probably shouldn't do this, however, I don't know how else to do it
  ipcMain.on('init-typing', (event, textFile) => {
    event.sender.send('init-typing', textFile)
  })
  ipcMain.on('save-typing', (event) => {
    event.sender.send('save-typing')
  })
  ipcMain.on('load-info', (event, bookId) => {
    event.sender.send('load-info', bookId);
  })

  // TODO: yeah i think dont do this, rethink closing and saving
  ipcMain.on("quit-app", () => {
    app.exit(0);
  })
};

function recompile() {
  if (app.isPackaged == false) {
    process.chdir(root);
    exec(`npx tsc && sass src/styles:dist/styles`, () => {
      app.relaunch();
      app.exit();
    })
  }
}

// Uses qwerty shortcuts, cringe.
app.on('browser-window-focus', function () {
  globalShortcut.register("CommandOrControl+R", () => {
    recompile();
  });
  globalShortcut.register("F5", () => {
    recompile();
  });
});

app.on('browser-window-blur', function () {
  globalShortcut.unregister('CommandOrControl+R');
  globalShortcut.unregister('F5');
});

app.on('ready', () => {
  // Because the running directory changes after compiled
  const dataPath = path.join(app.getPath('appData'), 'copytype');
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath);
  }
  process.chdir(dataPath);

  createWindow()
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
