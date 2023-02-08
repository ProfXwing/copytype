// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import * as library from "./library";
import { contextBridge, ipcRenderer, shell } from "electron";
import crypto from "crypto";
import fs from "fs";
const nonce = crypto.randomBytes(16).toString("base64");
import { Settings } from "./model/settingsModel";

require("electron-disable-file-drop");

exports.nonce = nonce;

contextBridge.exposeInMainWorld("electron", {
  getDataFromJSON: library.getDataFromJSON,
  getSettings: library.getSettings,
  saveSettings: library.saveSettings,
  defaultSettings: library.defaultSettings,
  createBook: () => {
    ipcRenderer.send("create-book");
  },
  handleDeleteBook: (callback: (bookId: string, bookTitle: string) => void) => {
    ipcRenderer.on("warn-delete-book", (event, bookId, bookTitle) => {
      callback(bookId, bookTitle);
    });
  },
  deleteBook: (bookName: string) => {
    ipcRenderer.send("delete-book", bookName);
  },
  loadLibrary: library.loadLibrary,
  handleInitTyping: (callback: (textFile: string) => void) => {
    ipcRenderer.on("init-typing", (event, textFile) => {
      callback(textFile);
    });
  },
  saveBookStats: library.saveBookStats,
  getBookStats: library.getBookStats,
  getBookData: library.getBookData,
  restartBook: library.restartBook,
  handleSaveTyping: (callback: () => void) => {
    ipcRenderer.on("save-typing", async () => {
      await callback();
    });

    ipcRenderer.on("save-and-close", async () => {
      await callback();
      ipcRenderer.send("quit-app");
    });

    // TODO: refresh doesn't save; maybe do something about that
  },
  handleLoadInfo: (callback: (bookId: string) => void) => {
    ipcRenderer.on("load-info", (event, bookId) => {
      callback(bookId);
    });
  },
  handleBookExists: (callback: () => void) => {
    ipcRenderer.on("book-exists", () => {
      callback();
    });
  },
  handleDRM: (callback: () => void) => {
    ipcRenderer.on("drm-error", () => {
      callback();
    });
  },
  saveTypingHistory: library.saveTypingHistory,
  getTypingHistory: library.getTypingHistory,
  clearTypingHistory: library.clearTypingHistory,
  operatingSystem: process.platform,
});

// contextBridge.exposeInMainWorld("model", {
//   BookStats: BookStats,
//   CustomTheme: CustomTheme,
//   MetaData = MetaDataModel,
// }

if (!fs.existsSync("settings.json")) {
  library.defaultSettings();
} else {
  const settings = library.getSettings();
  const defaultSettings = new Settings();
  for (const setting in defaultSettings) {
    if (settings[setting] === undefined) {
      settings[setting] = defaultSettings[setting as keyof Settings];
    }
  }

  if (!fs.existsSync("library/" + settings.currentBook)) {
    delete settings.currentBook;
  }
  library.saveSettings(settings);
}
// ensure each library book has typing history
for (const book of fs.readdirSync("./library")) {
  if (fs.lstatSync(`library/${book}`).isDirectory()) {
    if (!fs.existsSync(`library/${book}/typing-history.json`)) {
      library.saveTypingHistory([], book);
    }
  }
}


window.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll("a[href]");
  Array.prototype.forEach.call(links, function (link: Element) {
    const url = link.getAttribute("href");
    if (url.indexOf("http") === 0) {
      link.addEventListener("click", function (e: Event) {
        e.preventDefault();
        shell.openExternal(url);
      });
    }
  });
  document.getElementById(
    "head"
  ).innerHTML += `<meta http-equiv="Content-Security-Policy" content="default-src 'self' 'nonce-${nonce}'; img-src 'self' file:">`;

  const replaceText = (selector: string, text: string) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  for (const type of ["chrome", "node", "electron"]) {
    replaceText(`${type}`, process.versions[type]);
  }

  for (const script of Array.from(document.getElementsByTagName("script"))) {
    script.setAttribute("nonce", nonce);
  }

  ipcRenderer.on("start-loading", startLoading);
  ipcRenderer.on("stop-loading", stopLoading);

  ipcRenderer.on("load-book", (event, dir) => {
    library.addLibraryBook(dir);
    stopLoading();
  });

  ipcRenderer.on("remove-from-library", (event, bookName) => {
    library.removeLibraryBook(bookName);
  });

  ipcRenderer.on("console-log", (event, ...args) => {
    console.log(...args);
  });

  ipcRenderer.on("error", (event, ...args) => {
    console.error(...args);
  });
});

function startLoading() {
  console.log("???")
  document.getElementById("loading").classList.remove("hidden");
}

function stopLoading() {
  document.getElementById("loading").classList.add("hidden");
}

