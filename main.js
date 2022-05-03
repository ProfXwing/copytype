const {
    app,
    BrowserWindow,
    ipcMain,
    ipcRenderer
} = require('electron');
const path = require('path');
const {
    createBook, addLibraryBook, deleteBook
} = require('./js/library');



function createWindow() {
    const win = new BrowserWindow({
        width: 1920,
        height: 1080,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        }
    })

    win.loadFile('index.html');

    win.on("close", event => {
        win.webContents.send('save-and-close');
        event.preventDefault();
    })

    ipcMain.on('create-book', async (event) => {
        let dir = await createBook(event);
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
    ipcMain.on("quit-app", (event) => {
        app.exit(0);
    })

}

app.whenReady().then(() => {
    // Because the running directory changes after compiled
    process.chdir(app.getAppPath());

    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})