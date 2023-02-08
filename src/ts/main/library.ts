import StreamZip from 'node-stream-zip';
// wish i didn't have to use both, but seems most optimal as of rn
import { parse, HTMLElement as ParsedHTMLElement } from "node-html-parser";
import jsdom from "jsdom";
const { JSDOM } = jsdom;
import path from "path";
import fs from 'fs';
import { dialog, ipcRenderer, OpenDialogReturnValue, IpcMainEvent } from 'electron';
import { BookStats } from './model/bookStatsModel';
import { Settings } from './model/settingsModel';
import { MobiFile } from './mobi';
import { MetaDataModel } from './model/metaDataModel';

function removeFancyTypography(textToClean: string) {
  const specials = {
    "“": '"', // &ldquo;	&#8220;
    "”": '"', // &rdquo;	&#8221;
    "’": "'", // &lsquo;	&#8216;
    "‘": "'", // &rsquo;	&#8217;
    ",": ",", // &sbquo;	&#8218;
    "—": "-", // &mdash;  &#8212;
    "…": "...", // &hellip; &#8230;
    "«": "<<",
    "»": ">>",
    "–": "-",
  };
  return textToClean.replace(/[“”’‘—,…«»–]/g, (char) => {
    return specials[char as keyof object] || "";
  });
}

export async function createBook(event: IpcMainEvent) {
  let zip;
  let mobi;
  let epubDir;

  const dialogResult: OpenDialogReturnValue = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{
      name: 'Document',
      extensions: ['epub', 'txt', 'mobi']
    }]
  });

  if (dialogResult.canceled) return;
  else epubDir = dialogResult.filePaths[0];
  const fileType = path.extname(epubDir);

  // Check for DRM
  if (fileType == '.epub') {
    zip = new StreamZip.async({
      file: epubDir
    });

    if ('META-INF/encryption.xml' in await zip.entries()) {
      // check for drm
      const encryptionXML = (await zip.entryData('META-INF/encryption.xml')).toString();
      const encryptionDoc = new JSDOM(encryptionXML).window.document;

      for (const elem of Array.from(encryptionDoc.getElementsByTagName('encryptionmethod'))) {
        if (elem.getAttribute('Algorithm') != 'http://www.idpf.org/2008/embedding') {
          zip.close();
          event.sender.send("drm-error");
          return;
        }
      }
    }
  } else if (fileType == '.mobi') {
    const data = fs.readFileSync(epubDir).buffer;
    mobi = new MobiFile(data);
    mobi.load();

    // i guess this is how this works. i don't have any mobi books with drm
    if (mobi.mobi_header.drm_offset != 4294967295) {
      event.sender.send("drm-error");
      return;
    }
  }

  if (fs.existsSync('library') == false) {
    fs.mkdirSync('library');
  }

  const epubLibDir = `library/${path.parse(epubDir).name}/`
  const coverImagePath = epubLibDir + "cover.png";
  const jsonPath = epubLibDir + "meta-data.json";

  event.sender.send('start-loading');

  const existingBook = await bookExists(path.parse(epubDir).name, event);
  if (existingBook == false) {
    if (fs.existsSync(epubLibDir)) {
      fs.rmdirSync(epubLibDir, { recursive: true });
      event.sender.send("remove-from-library", path.parse(epubDir).name);
    }
  } else {
    event.sender.send('book-exists');
    event.sender.send("stop-loading");
    return;
  }


  // Create directory for epub data
  if (!fs.existsSync(epubLibDir)) {
    fs.mkdirSync(epubLibDir);
  }

  const chaptersDir = epubLibDir + "chapters/"
  if (!fs.existsSync(chaptersDir)) {
    fs.mkdirSync(chaptersDir);
  }

  let metaData: MetaDataModel;
  if (fileType == '.epub') {
    // TODO: Other people probably did this better. Use theirs instead.
    // Get rootfile from container xml 
    const containerXML = (await zip.entryData('META-INF/container.xml')).toString();
    const containerDoc = new JSDOM(containerXML).window.document;
    const opfDir = containerDoc.getElementsByTagName("rootfile")[0].getAttribute("full-path");

    // Get cover file from rootfile
    const opfData = (await zip.entryData(opfDir)).toString();
    const opfDoc = new JSDOM(opfData).window.document;


    let coverMeta;
    for (const meta of Array.from(opfDoc.getElementsByTagName("meta"))) {
      if (meta.getAttribute("name") == "cover") {
        coverMeta = meta.getAttribute("content");
      }
    }

    let coverImageFile;
    for (const item of Array.from(opfDoc.getElementsByTagName("item"))) {
      if (item.getAttribute("id") == coverMeta || item.getAttribute("properties") == coverMeta) {
        coverImageFile = item.getAttribute("href");
        break;
      }
    }

    if (!coverImageFile) {
      ipcRenderer.send('error', 'No cover image found');
    }

    // Create directory for epub data
    if (!fs.existsSync(epubLibDir)) {
      fs.mkdirSync(epubLibDir);
    }

    const chaptersDir = epubLibDir + "chapters/"
    // Convert epub to text 
    if (!fs.existsSync(chaptersDir)) {
      fs.mkdirSync(chaptersDir);
    }
    let chapCount = 0;
    const epubText: string[] = []
    for (const itemref of Array.from(opfDoc.getElementsByTagName("spine")[0].getElementsByTagName("itemref"))) {
      const idref = itemref.getAttribute("idref");
      const chapHTMLPath = opfDoc.getElementById(idref).getAttribute("href");
      const chapHTMLString = await (await zip.entryData(path.join(opfDir + `/../${chapHTMLPath}`).replace(/\\/g, "/"))).toString();
      const chapDoc = parse(chapHTMLString);

      // todo no spacing between elements. i might have to loop through each elements like in mobi
      const chapTextString = chapDoc.querySelector("body").innerText;

      const chapText = readyText(chapTextString);

      if (!(chapText.length == 1 && chapText[0] == "")) {

        const chapTextPath = chaptersDir + `${chapCount}.json`;
        const chapTextJson = JSON.stringify(chapText);

        fs.writeFileSync(chapTextPath, chapTextJson);

        epubText.push(chapTextPath);

        chapCount++;
      }
    }

    metaData = {
      "title": opfDoc.getElementsByTagName("dc:title")[0].textContent,
      "author": opfDoc.getElementsByTagName("dc:creator")[0].textContent,
      "written": opfDoc.getElementsByTagName("dc:date")[0].textContent,
      "textPath": epubText,
      "dateStarted": new Date(),
      "division": "Chapter"
    }

    // Gets a snapshot of the cover if it's xhtml or html
    const imgExt = path.extname(coverImageFile);
    if (imgExt == ".xhtml" || imgExt == ".html") {
      const coverDoc = parse((await zip.entryData(path.join(`${opfDir}/../`, coverImageFile).replaceAll("\\", "/"))).toString());
      let newHTML = "";
      let extractedImageCount = 0;
      for (const elem of coverDoc.querySelector('body').querySelectorAll("*")) {
        const text = readyText(elem.innerText).join(" ");
        if (text != "") {
          newHTML += `<${elem.tagName}>${text}</${elem.tagName}>`;
        }

        if (elem.tagName == "IMG") {
          let newImgPath = path.join(epubLibDir, `images/`)
          if (!fs.existsSync(newImgPath)) {
            fs.mkdirSync(newImgPath);
          }

          const src = elem.getAttribute("src");
          let imgPath;
          if (src.startsWith("data:image")) {
            const imgData = src.split(",")[1];
            imgPath = path.join(newImgPath, `${extractedImageCount}.png`);
            fs.writeFileSync(imgPath, Buffer.from(imgData, "base64"));
            elem.setAttribute("src", imgPath.toString());
            extractedImageCount++;
          } else {
            imgPath = path.join(`${opfDir}/../`, elem.getAttribute("src")).replaceAll("\\", "/");
            await zip.extract(imgPath, newImgPath);
          }

          newImgPath = path.join(process.cwd(), newImgPath, path.parse(imgPath).base);
          newHTML += `<img src="file://${newImgPath}" />`;
        }
      }

      metaData.coverHTML = newHTML;
    } else if (['.jpg', '.png', '.jpeg'].includes(imgExt)) {
      const zippedCoverPath = path.join(opfDir + "/../" + coverImageFile);
      await zip.extract(zippedCoverPath.replace(/\\/g, "/"), coverImagePath.replace(/\\/g, "/"));
      metaData.coverImage = coverImagePath;
    } else {
      console.log(imgExt);
      event.sender.send('console-log', "Cover image is not a valid image type");
      event.sender.send("console-log", imgExt)
    }

    await zip.close();


  } else if (fileType == '.txt') {
    const chapTextString = fs.readFileSync(epubDir, 'utf8');
    const chapText = readyText(chapTextString);

    const chapTextPath = chaptersDir + `0.json`;
    const chapTextJson = JSON.stringify(chapText);

    fs.writeFileSync(chapTextPath, chapTextJson);

    const epubText = [chapTextPath];

    metaData = {
      // todo: better txt images somehow
      "coverHTML": `<h1>${path.parse(epubDir).name}</h1>`,
      "coverStyle": [
        ["text-align", "center"]
      ],
      "title": path.parse(epubDir).name,
      "textPath": epubText,
      "dateStarted": new Date(),
      "division": ""
    }
  } else if (fileType == '.mobi') {
    const html = mobi.read_text();
    const book_data = mobi.get_book_data();

    const title = book_data.title;
    const author = book_data.author;

    metaData = {
      "title": title,
      "author": author,
      "dateStarted": new Date(),
      "division": "Page"
    }

    // TODO: options (first page, first image, custom image)
    const coverImage = mobi.get_cover_image();
    if (coverImage) {
      fs.writeFileSync(coverImagePath, coverImage, 'binary');
      metaData.coverImage = coverImagePath;
    }

    const textDoc = parse(html);

    let chapCount = 0;
    const epubText = [];
    let chapText = "";
    let chapHTML = "";
    let extractedImageCount = 0;

    const lastChild = textDoc.querySelector("body").lastChild;
    for (const elem of textDoc.querySelector("body").childNodes as ParsedHTMLElement[]) {
      chapText += elem.innerText;
      chapText += " ";

      if (chapCount == 0 && !coverImage) {
        const text = readyText(elem.innerText).join(" ");
        // Adds all text elements to cover snapshot
        if (text != "") {
          chapHTML += `<${elem.tagName}>${text}</${elem.tagName}>`;
        }

        // gets image elements from elem
        let imgElems: ParsedHTMLElement[] = [];
        if (elem.tagName == "IMG") {
          imgElems.push(elem);
        } else if (elem.querySelectorAll('img').length > 0) {
          imgElems = elem.querySelectorAll('img');
        }

        // extracts images from elem and adds to snapshot
        for (const imgElem of imgElems) {
          const newImgPath = path.join(epubLibDir, `images/`)
          if (!fs.existsSync(newImgPath)) {
            fs.mkdirSync(newImgPath);
          }

          const imgPath = path.join(newImgPath, `${extractedImageCount}.png`);
          const src = imgElem.getAttribute("src");

          if (!src && imgElem.getAttribute("recindex")) {
            const imageBinary = mobi.read_image(parseInt(imgElem.getAttribute("recindex")) - 1);
            fs.writeFileSync(imgPath, imageBinary, 'binary');
          } else {
            if (src.startsWith("data:image")) {
              const imgData = src.split(",")[1];
              fs.writeFileSync(imgPath, Buffer.from(imgData, "base64"));
              imgElem.setAttribute("src", imgPath.toString());
              extractedImageCount++;
            } // other image types?
          }

          chapHTML += `<img src="file://${path.join(process.cwd(), imgPath)}" />`;
        }
      }

      // next page on page break
      if (elem.rawTagName == 'mbp:pagebreak' || elem == lastChild) {
        const chapTextArray = readyText(chapText);
        if (!arraysEqual(chapTextArray, [""]) && !arraysEqual(chapTextArray, [" "])) {
          const chapTextPath = chaptersDir + `${chapCount}.json`;
          const chapTextJson = JSON.stringify(chapTextArray);

          fs.writeFileSync(chapTextPath, chapTextJson);

          epubText.push(chapTextPath);

          chapCount++;
          chapText = "";
        }
      }
    }

    metaData.textPath = epubText;
    if (chapHTML != "") {
      metaData.coverHTML = chapHTML;
    }
  }

  const bookStats = new BookStats(path.parse(epubDir).name);
  await saveBookStats(bookStats);

  const dataJSON = JSON.stringify(metaData);
  fs.writeFileSync(jsonPath, dataJSON);

  const settings = getSettings();
  settings.recentBooks.unshift(metaData.title);
  saveSettings(settings);

  return path.parse(epubDir);
}

// todo: modularize book creation for fixing broken books
// todo: use this function at start up to validate all books once modularized
// Checks if the book exists and is valid
async function bookExists(bookName: string, event: IpcMainEvent) {
  const epubLibDir = `library/${bookName}/`
  const jsonPath = epubLibDir + "meta-data.json";

  let existingBook = true;
  if (fs.existsSync(epubLibDir)) {
    if (fs.existsSync(jsonPath)) {
      const data = getDataFromJSON(jsonPath);

      // Checks existence of cover image
      if (data.coverImage) {
        if (!fs.existsSync(data.coverImage)) {
          event.sender.send('error', "Book already exists, but cover image is missing. Deleting...");
          existingBook = false;
        }

        // Checks existence of cover html
      } else if (!data.coverHTML) {
        event.sender.send('error', "Book already exists, but cover is missing. Deleting...");
        existingBook = false;
      }

      // Checks existence of meta data (title, date started, division type)
      if (data.title == undefined || data.dateStarted == undefined || data.division == undefined) {
        event.sender.send('error', "Book already exists, but necessary meta data (title, date started, division) is missing. Deleting...");
        existingBook = false;
      }

      // Checks existence of chapters
      if (data.textPath) {
        for (const path of data.textPath) {
          if (!fs.existsSync(path)) {
            event.sender.send('error', `Book already exists, but text path ${path} not found. Deleting...`);
            existingBook = false;
          }
        }
      } else {
        event.sender.send('error', "Book already exists, but text paths are missing. Deleting...");
        existingBook = false;
      }
      // checks existence of json file
    } else {
      event.sender.send('error', "Book already exists, but book data not found. Deleting...");
      existingBook = false;
    }

    if (fs.existsSync(epubLibDir + "typing-stats.json")) {
      const bookStats = getDataFromJSON(epubLibDir + "typing-stats.json");

      // Ensures existence of top-level keys in book stats
      // todo: iterate through entire tree of keys
      for (const [key, value] of Object.entries(new BookStats())) {
        if (bookStats[key] == undefined) {
          event.sender.send('error', `Book stats missing key: ${key} \nAdding missing key...`);
          if (key == "bookName") {
            bookStats[key] = bookName;
          } else {
            bookStats[key] = value;
          }
        }
      }
      await saveBookStats(bookStats);

      // Checks existence of typing stats
    } else {
      event.sender.send('error', "Book stats not found. Creating...");
      const bookStats = new BookStats(bookName);
      await saveBookStats(bookStats);
    }

    // New book!
  } else {
    existingBook = false;
  }

  return existingBook;
}

export function restartBook(book: string) {
  const bookStats = getBookStats(book);
  const defaultStats = new BookStats();
  bookStats.saved.wpm.timeTyping += bookStats.wpm.timeTyping;
  bookStats.saved.wpm.correctChars += bookStats.wpm.correctChars;
  bookStats.saved.accuracy.typedChars += bookStats.accuracy.typedChars;
  bookStats.saved.accuracy.correctChars += bookStats.accuracy.correctChars;
  bookStats.wpm = defaultStats.wpm;
  bookStats.accuracy = defaultStats.accuracy;
  bookStats.chapter = 0;
  bookStats.typedPos = 0;
  bookStats.startedBook = false;
  bookStats.finishedBook = false;
  saveBookStats(bookStats);
}

// Ready chapText for typing
function readyText(chapText: string) {
  //--------------------Ready chapText for typing----------------------

  // TODO remove more invisible characters
  // Removes invisible space character.
  chapText = chapText.replace(/\ufeff/g, "");

  chapText = parseHtmlEntities(chapText);
  chapText = chapText.replace(/[\t\r\v\f\b\0]/g, '');
  chapText = chapText.replaceAll('	', '').replaceAll(' ', '');
  chapText = removeFancyTypography(chapText);
  chapText = chapText.replace(/  +/g, ' ')
  chapText = chapText.replaceAll('\n ', '\n');
  chapText = chapText.replaceAll(' \n', '\n');

  let chapTextArr = chapText.split("");

  // Don't allow first character to be whitespace
  while (chapTextArr[0] == "\n" || chapTextArr[0] == " ") {
    chapTextArr.splice(0, 1);
  }

  // Don't allow last character to be whitespace
  while (chapTextArr[chapTextArr.length - 1] == "\n" || chapTextArr[chapTextArr.length - 1] == " ") {
    chapTextArr.splice(chapTextArr.length - 1, 1);
  }

  chapText = chapTextArr.join("");

  while (chapText.includes("\n\n")) {
    chapText = chapText.replaceAll('\n\n', '\n');
  }

  chapText = chapText.replaceAll("\n", "\n ").replace(/  +/g, ' ')
  chapTextArr = chapText.split(" ");

  return chapTextArr;
  // -------------------------------------------------------------
}

function parseHtmlEntities(str: string) {
  return str.replace(/&#([0-9]{1,4});/gi, function (match, numStr) {
    const num = parseInt(numStr, 10); // read num as normal number
    return String.fromCharCode(num);
  });
}

export async function deleteBook(event: IpcMainEvent, bookName: string) {
  event.sender.send("start-loading");
  const data = getBookData(bookName);
  const settings = getSettings();

  if (settings.recentBooks.includes(data.title)) {
    settings.recentBooks.splice(settings.recentBooks.indexOf(data.title), 1);
    saveSettings(settings);
  }

  const path = `library/${bookName}`;
  if (fs.existsSync(path)) {
    fs.rmSync(path, {
      recursive: true
    });
    event.sender.send("remove-from-library", bookName);
    event.sender.send("stop-loading");
    const settings = getSettings();

    if (settings.currentBook == bookName) {
      delete settings.currentBook;
      saveSettings(settings);
    }
  }
}

export function getDataFromJSON(dir: string) {
  if (dir.substring(0, 8) != 'library/') dir = 'library/' + dir;
  return JSON.parse(fs.readFileSync(dir).toString());
}

export function saveTypingHistory(typingHistory: [number, string][], bookName: string) {
  const json = JSON.stringify(typingHistory);
  fs.writeFileSync(`./library/${bookName}/typing-history.json`, json);
}

export function getTypingHistory() {
  return JSON.parse(fs.readFileSync("./typing-history.json").toString());
}

export function clearTypingHistory() {
  for (const book of fs.readdirSync("./library")) {
    saveTypingHistory([], book);
  }
}

export function getBookStats(bookName: string) {
  return JSON.parse(fs.readFileSync(`./library/${bookName}/typing-stats.json`).toString());
}

export function getBookData(bookName: string) {
  return JSON.parse(fs.readFileSync(`./library/${bookName}/meta-data.json`).toString());
}

export async function saveBookStats(stats: BookStats) {
  const bookStatsJSON = JSON.stringify(stats);
  if (fs.existsSync(`./library/${stats.bookName}`))
    fs.writeFileSync(`./library/${stats.bookName}/typing-stats.json`, bookStatsJSON);
}

export function getSettings() {
  return JSON.parse(fs.readFileSync("./settings.json").toString());
}

export function saveSettings(settings: Settings) {
  const settingsJSON = JSON.stringify(settings);
  fs.writeFileSync("./settings.json", settingsJSON)
  //todo: send message to main window to update settings
}

export function defaultSettings() {
  const settings = new Settings();
  saveSettings(settings);
  return settings;
}

function insertBookAtIndex(newBook: Element, libraryElem: Element, index: number) {
  if (index >= libraryElem.children.length - 1) {
    libraryElem.insertBefore(newBook, libraryElem.querySelector('#new-book'));
  } else {
    libraryElem.insertBefore(newBook, libraryElem.children[index]);
  }
}

// Gets all books previously added and adds them to library
export async function loadLibrary() {
  const dir = await fs.promises.opendir('library/')

  const titles = [];
  for await (const child of dir) {
    if (child.isDirectory()) {
      titles.push(getBookData(child.name).title);
      addLibraryBook(child);
    }
  }

  const settings = getSettings();

  for (const book of structuredClone(settings.recentBooks)) {
    if (!titles.includes(book)) {
      settings.recentBooks.splice(settings.recentBooks.indexOf(book), 1);
    }
  }
  saveSettings(settings);
}

// Add book to library from path
export function addLibraryBook(bookDir: fs.Dirent) {
  let data: MetaDataModel, cover;
  const jsonPath = `./library/${bookDir.name}/meta-data.json`;
  if (fs.existsSync(jsonPath)) {
    data = JSON.parse(fs.readFileSync(jsonPath).toString());
  } else {
    console.error("Could not find book at: ", jsonPath);
    return;
  }

  if (data.coverImage) {
    if (fs.existsSync(data.coverImage)) {
      cover = `<img id="cover-img" src='file://${path.resolve(data.coverImage)}'>`;
    } else {
      console.error("Book " + bookDir.name + " is missing its alleged cover image (" + data.coverImage + ")");
      return;
    }
  } else if (data.coverHTML) {
    cover = `<div class="html-img">${data.coverHTML}</div>`;
  }

  if (cover) {

    const libraryElem = document.getElementById("library").getElementsByClassName('library-books')[0];
    const newBook = document.createElement("div");
    newBook.classList.add("book-choice");
    newBook.setAttribute("id", bookDir.name);

    newBook.innerHTML = `<div class="cover-img-wrapper">
                                ${cover}
                            </div>
                            <div class="title-wrapper">
                                <label id="book-title"></label>
                            </div>
                            <div class="book-buttons">
                                <i class="fas fa-keyboard"></i>
                                <i class="fas fa-chart-bar"></i>
                                <i class="fas fa-trash-alt"></i>
                            </div>`

    newBook.querySelector("#book-title").textContent = data.title;
    newBook.querySelector("#book-title").setAttribute('title', data.title);

    // TODO: book settings, cover image, title, etc.

    (newBook.querySelector('.fa-keyboard') as HTMLElement).onclick = () => {
      const settings = getSettings();
      if (settings.recentBooks.includes(data.title)) {
        settings.recentBooks.splice(settings.recentBooks.indexOf(data.title), 1);
      }
      settings.recentBooks.unshift(data.title);
      saveSettings(settings);

      libraryElem.children[0].before(newBook);
      ipcRenderer.send('init-typing', bookDir.name)
    }

    (newBook.querySelector('.fa-trash-alt') as HTMLElement).onclick = () => {
      ipcRenderer.send("warn-delete-book", bookDir.name, data.title);
    }

    (newBook.querySelector('.fa-chart-bar') as HTMLElement).onclick = () => {
      ipcRenderer.send('load-info', bookDir.name);
    }

    if (data.coverStyle) {
      for (const [key, value] of data.coverStyle) {
        newBook.style.setProperty(key, value);
      }
    }

    const bookNames = [];
    for (const child of Array.from(libraryElem.children)) {
      if (!child.classList.contains('new-book-container')) {
        bookNames.push(child.querySelector("#book-title").textContent);
      }
    }

    bookNames.push(data.title);

    const settings = getSettings();

    if (settings.bookSort != "alphabetical" && settings.bookSort != "recent") {
      settings.bookSort = "recent";
      saveSettings(settings);
    }

    // sort alphabetically by title
    if (settings.bookSort == 'alphabetical') {
      bookNames.sort((a, b) => a.localeCompare(b));

      const index = bookNames.indexOf(data.title);
      insertBookAtIndex(newBook, libraryElem, index);

      // sorts by most recent book typed
    } else if (settings.bookSort == 'recent') {
      for (const name of bookNames) {
        if (!settings.recentBooks.includes(name)) {
          settings.recentBooks.push(name);
        }
      }

      bookNames.sort((a, b) => {
        return settings.recentBooks.indexOf(a) - settings.recentBooks.indexOf(b);
      });
      const index = bookNames.indexOf(data.title);
      insertBookAtIndex(newBook, libraryElem, index);
    }

    // Sizing only for when there isn't a cover image. Otherwise, css can handle the sizing.
    // poorly named, oops
    if (data.coverHTML) {
      const htmlImg = newBook.querySelector('.html-img') as HTMLElement;
      htmlImg.style.opacity = "0";

      // set size after 0.1s to allow for image to load, 
      // would love for it to load when the div is ready, but idk how
      setTimeout(() => {
        const imgRect = htmlImg.getBoundingClientRect();
        const imgWrapperRect = libraryElem.getElementsByClassName("cover-img-wrapper")[0].getBoundingClientRect();

        const ratio = Math.min(imgWrapperRect.width / imgRect.width, imgWrapperRect.height / imgRect.height);

        const newHeight = imgRect.height * ratio;
        htmlImg.style.marginTop = `${(imgWrapperRect.height - newHeight) / 2}px`;

        // todo maybe actually fix scaling instead of doing this
        if (ratio < 1) {
          htmlImg.style.transform = `scale(${ratio})`;
        }

        htmlImg.style.opacity = '1';
      }, 100);
    }
  }
}

export function removeLibraryBook(bookName: string) {
  const bookDiv = document.getElementById(bookName);
  if (bookDiv) {
    bookDiv.parentNode.removeChild(bookDiv);
  }
}

function arraysEqual(arr1: any[], arr2: any[]) {
  if (arr1.length !== arr2.length) {
    return false;
  }
  for (let i = arr1.length; i--;) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }
  return true;
}

exports.clearTypingHistory = clearTypingHistory