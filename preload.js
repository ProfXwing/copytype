const library = require('./js/library');
const {
    contextBridge,
    ipcRenderer
} = require('electron')
const crypto = require('crypto');
const fs = require('fs');
const nonce = crypto.randomBytes(16).toString('base64');
const { Settings } = require('./js/model/settingsModel.js')
const shell = require('electron').shell

exports.nonce = nonce;

contextBridge.exposeInMainWorld('electron', {
    getDataFromJSON: library.getDataFromJSON,
    getSettings: library.getSettings,
    saveSettings: library.saveSettings,
    defaultSettings: library.defaultSettings,
    createBook: () => {
        ipcRenderer.send('create-book')
    },
    handleDeleteBook: (callback) => {
        ipcRenderer.on('warn-delete-book', (event, bookId, bookTitle) => {
            callback(bookId, bookTitle);
        })
    },
    deleteBook: (bookName) => {
        ipcRenderer.send("delete-book", bookName);
    },
    handleInitTyping: (callback) => {
        ipcRenderer.on('init-typing', (event, textFile) => {
            callback(textFile)
        })
    },
    saveBookStats: library.saveBookStats,
    getBookStats: library.getBookStats,
    getBookData: library.getBookData,
    restartBook: library.restartBook,
    handleSaveTyping: (callback) => {
        ipcRenderer.on('save-typing', async () => {
            await callback()
        })

        ipcRenderer.on('save-and-close', async () => {
            await callback();
            ipcRenderer.send('quit-app');
        })

        // TODO: refresh doesn't save; maybe do something about that
    },
    handleLoadInfo: (callback) => {
        ipcRenderer.on('load-info', (event, bookId) => {
            callback(bookId);
        })
    },
    handleBookExists: (callback) => {
        ipcRenderer.on('book-exists', () => {
            callback();
        })
    },
    handleDRM: (callback) => {
        ipcRenderer.on('drm-error', () => {
            callback();
        })
    },
    operatingSystem: process.platform
})


if (!fs.existsSync("settings.json")) {
    library.defaultSettings();
} else {
    let settings = library.getSettings();
    let defaultSettings = new Settings();
    for (let setting in defaultSettings) {
        if (settings[setting] === undefined) {
            settings[setting] = defaultSettings[setting];
        }
    }

    if (!fs.existsSync('library/' + settings.currentBook)) {
        delete settings.currentBook;
    }
    library.saveSettings(settings);
}



window.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('a[href]')
    Array.prototype.forEach.call(links, function (link) {
    const url = link.getAttribute('href')
    if (url.indexOf('http') === 0) {
       link.addEventListener('click', function (e) {
           e.preventDefault()
           shell.openExternal(url)
       })
    }
 })
    document.getElementById("head").innerHTML += `<meta http-equiv="Content-Security-Policy" content="default-src 'self' 'nonce-${nonce}'">`;

    const replaceText = (selector, text) => {
        const element = document.getElementById(selector)
        if (element) element.innerText = text
    }

    for (const type of ['chrome', 'node', 'electron']) {
        replaceText(`${type}`, process.versions[type])
    }

    for (let script of document.getElementsByTagName("script")) {
        script.setAttribute("nonce", nonce);
    }

    library.loadLibrary();

    ipcRenderer.on('start-loading', startLoading)
    ipcRenderer.on('stop-loading', stopLoading)

    ipcRenderer.on('load-book', (event, dir) => {
        library.addLibraryBook(dir);
        stopLoading();
    })

    ipcRenderer.on('remove-from-library', (event, bookName) => {
        library.removeLibraryBook(bookName);
    });

    ipcRenderer.on('console-log', (event, ...args) => {
        console.log(...args);
    })
});

function startLoading() {
    document.getElementById("loading").classList.remove("hidden");
}

function stopLoading() {
    document.getElementById("loading").classList.add("hidden");
}