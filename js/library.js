const StreamZip = require('node-stream-zip');
const {
    parse
} = require("node-html-parser");
const path = require("path");
const puppeteer = require("puppeteer");
const fs = require('fs');
const {
    dialog,
    ipcMain,
    ipcRenderer
} = require('electron');
const {
    BookStats
} = require('./model/bookStatsModel');
const { Settings } = require('./model/settingsModel');
const { MobiFile } = require('./mobi');

function removeFancyTypography(textToClean) {
    var specials = {
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
    return textToClean.replace(/[“”’‘—,…«»–]/g, (char) => specials[char] || "");
}

async function createBook(event) {
    var zip;
    let epubDir;
    let dialogResult = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{
            name: 'Document',
            extensions: ['epub', 'txt', 'mobi']
        }]
    });

    if (dialogResult.canceled) return;
    else epubDir = dialogResult.filePaths[0];
    let fileType = path.extname(epubDir);

    // Check for DRM
    if (fileType == '.epub') {
        zip = new StreamZip.async({
            file: epubDir
        });

        if ('META-INF/encryption.xml' in await zip.entries()) {
            // check for drm
            const encryptionXML = (await zip.entryData('META-INF/encryption.xml')).toString();
            const encryptionDoc = parse(encryptionXML);

            // No idea why querySelector doesn't work for EncryptionMethod
            for (let elem of encryptionDoc.querySelectorAll('*')) {
                if (elem.rawTagName == 'EncryptionMethod' && elem.getAttribute('Algorithm') != 'http://www.idpf.org/2008/embedding') {
                    zip.close();
                    event.sender.send("drm-error");
                    return;
                }
            }
        }
    }

    let epubLibDir = `library/${path.parse(epubDir).name}/`
    let coverImagePath = epubLibDir + "cover.png";
    let jsonPath = epubLibDir + "meta-data.json";

    if (fs.existsSync(epubLibDir)) {
        if (fs.existsSync(jsonPath) && fs.existsSync(coverImagePath)) {
            event.sender.send('book-exists');
            return;
        } else {
            fs.rmdirSync(epubLibDir, {
                recursive: true
            });
        }
    }

    event.sender.send('start-loading');

    // Create directory for epub data
    if (!fs.existsSync(epubLibDir)) {
        fs.mkdirSync(epubLibDir);
    }

    let chaptersDir = epubLibDir + "chapters/"
    if (!fs.existsSync(chaptersDir)) {
        fs.mkdirSync(chaptersDir);
    }

    var metaData;
    if (fileType == '.epub') {
        // TODO: Other people probably did this better. Use theirs instead.
        // Get rootfile from container xml 
        const containerXML =  (await zip.entryData('META-INF/container.xml')).toString();
        const containerDoc = parse(containerXML);
        const opfDir = containerDoc.querySelector("rootfile").getAttribute("full-path");
    
        // Get cover file from rootfile
        const opfData = (await zip.entryData(opfDir)).toString();
        const opfDoc = parse(opfData);
    
        let coverMeta;
        for (let meta of opfDoc.querySelectorAll("meta")) {
            if (meta.getAttribute("name") == "cover") {
                coverMeta = meta.getAttribute("content");
            }
        }
        let coverImageFile = thoroughQuery(opfDoc, coverMeta).getAttribute("href");
    
        // Create directory for epub data
        if (!fs.existsSync(epubLibDir)) {
            fs.mkdirSync(epubLibDir);
        }
    
        let chaptersDir = epubLibDir + "chapters/"
        // Convert epub to text 
        if (!fs.existsSync(chaptersDir)) {
            fs.mkdirSync(chaptersDir);
        }
        let chapCount = 0;
        let epubText = []
        for (let itemref of opfDoc.querySelectorAll("itemref")) {
            if (itemref.parentNode == opfDoc.querySelector("spine")) {
                let idref = itemref.getAttribute("idref");
                let chapHTMLPath = thoroughQuery(opfDoc, idref).getAttribute("href");
                let chapHTMLString = await (await zip.entryData(path.join(opfDir + `/../${chapHTMLPath}`).replace(/\\/g, "/"))).toString();
                let chapDoc = parse(chapHTMLString);
                let chapText = chapDoc.querySelector("body").innerText;
                
                // TODO: optionally do this when text is shown
                chapText = readyText(chapText);

                if (chapText != "") {
    
                    let chapTextPath = chaptersDir + `${chapCount}.json`;
                    let chapTextJson = JSON.stringify(chapText);
        
                    fs.writeFileSync(chapTextPath, chapTextJson);
        
                    epubText.push(chapTextPath);

                    chapCount++;
                }
            }
        }
    
        // Gets a snapshot of the cover if it's xhtml or html
        let imgExt = path.extname(coverImageFile);
        if (imgExt == ".xhtml" || imgExt == ".html") {
            if (fs.existsSync('extracted')) {
                fs.rmdirSync("extracted", {
                    recursive: true
                });
            }
            fs.mkdirSync('extracted');
            await zip.extract(null, './extracted');
            await zip.close();
    
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            let coverXHTMLPath = `file://${path.resolve("./extracted")}\\${path.join(`${opfDir}/../${coverImageFile}`)}`;
            await page.goto(coverXHTMLPath);
    
            await page.setViewport({
                width: 425,
                height: 550,
    
                // Todo: make this adjustable 
                deviceScaleFactor: 8
            });
    
            await page.screenshot({
                path: coverImagePath,
                fullpage: true
            });
            await browser.close();
    
            fs.rmdirSync("extracted", {
                recursive: true
            });
        } else if (imgExt == ".jpg" || imgExt == ".png") {
            let zippedCoverPath = path.join(opfDir + "/../" + coverImageFile);
            await zip.extract(zippedCoverPath.replace(/\\/g, "/"), coverImagePath.replace(/\\/g, "/"));
        }
    
        await zip.close();
    
        metaData = {
            "coverImg": coverImagePath,
            "title": opfDoc.querySelector("dc\\:title").innerText,
            "author": opfDoc.querySelector("dc\\:creator").innerText,
            "written": opfDoc.querySelector("dc\\:date").innerText,
            "textPath": epubText,
            "dateStarted": new Date(),
            "division": "Chapter"
        }
    } else if (fileType == '.txt') {
        let chapText = fs.readFileSync(epubDir, 'utf8');
        chapText = readyText(chapText);

        let chapTextPath = chaptersDir + `0.json`;
        let chapTextJson = JSON.stringify(chapText);

        fs.writeFileSync(chapTextPath, chapTextJson);

        let epubText = [chapTextPath];
    
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(`<h1 style="text-align:center">${path.parse(epubDir).name}</h1>`);

        await page.setViewport({
            width: 425,
            height: 550,

            // Todo: make this adjustable 
            deviceScaleFactor: 8
        });

        await page.screenshot({
            path: coverImagePath,
            fullpage: true
        });
        await browser.close();
    
        metaData = {
            "coverImg": coverImagePath,
            "title": path.parse(epubDir).name,
            "textPath": epubText,
            "dateStarted": new Date(),
            "division": ""
        }
    } else if (fileType == '.mobi') {
        let data = fs.readFileSync(epubDir).buffer;
        let mobi = new MobiFile(data);
        mobi.load();


        let html = mobi.read_text();
        event.sender.send('console-log', html);
        let book_data = mobi.get_book_data();
        
        let textDoc = parse(html);

        // todo: split into pages
        let chapCount = 0;
        let epubText = [];
        let chapText = "";

        let lastChild = textDoc.querySelector("body").lastChild;
        for (let elem of textDoc.querySelector("body").childNodes) {
            chapText += elem.innerText;
            chapText += " ";
            
            if (elem.rawTagName == 'mbp:pagebreak' || elem == lastChild) {
                chapText = readyText(chapText);
                if (chapText != "" && chapText != " ") {
                    let chapTextPath = chaptersDir + `${chapCount}.json`;
                    let chapTextJson = JSON.stringify(chapText);
    
                    fs.writeFileSync(chapTextPath, chapTextJson);
    
                    epubText.push(chapTextPath);
    
                    chapCount++;
                    chapText = "";
                }
            }
        }


        // let chapText = textDoc.querySelector("body").innerText;

        // chapText = readyText(chapText);

        // let chapTextPath, chapTextJson;
        // if (chapText != "") {

        //     chapTextPath = chaptersDir + `0.json`;
        //     chapTextJson = JSON.stringify(chapText);

        //     fs.writeFileSync(chapTextPath, chapTextJson);
        // }

        let title = book_data.title;
        let author = book_data.author;


        // TODO: options (first page, first image, custom image)
        // TODO: async so user can choose option while screenshot is processing
        let coverImage = mobi.get_cover_image();
        if (coverImage) {
            fs.writeFileSync(coverImagePath, coverImage, 'binary');
        } else {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();

            let renderHTML = parse(html);
            let imgSrcs = mobi.render_to(renderHTML);

            page.setContent(html);
            page.evaluate((imgSrcs) => {
                var imgDoms = document.querySelectorAll("img");
                for (var i = 0 ;i < imgDoms.length; i++) {
                    var imgDom = imgDoms[i];
                    imgDom.src = imgSrcs[i];
                }

            }, imgSrcs);
            
            await page.setViewport({
                width: 425,
                height: 550,

                // Todo: make this adjustable 
                deviceScaleFactor: 8
            });

            await page.screenshot({
                path: coverImagePath,
                fullpage: true
            });
            await browser.close(); 
        }

        metaData = {
            "coverImg": coverImagePath,
            "title": title,
            "author": author,
            "textPath": epubText,
            "dateStarted": new Date(),
            "division": "Page"
        }
    }

    let bookStats = new BookStats(path.parse(epubDir).name);
    await saveBookStats(bookStats);

    let dataJSON = JSON.stringify(metaData);
    fs.writeFileSync(jsonPath, dataJSON);

    return path.parse(epubDir);
}

// Sometimes doesn't return element from querySelector idk why
function thoroughQuery(document, id) {
    let item = document.querySelector("#" + id);
    if (!item) {
        for (let child of document.querySelectorAll("*")) {
            if (child.id == id) {
                item = child;
            }
        }
    }
    return item;
}


// Ready chapText for typing
function readyText(chapText) {
    //--------------------Ready chapText for typing----------------------
    chapText = chapText.replaceAll('	', '').replaceAll(' ', '');
    chapText = removeFancyTypography(chapText);
    chapText = chapText.replace(/  +/g, ' ')
    chapText = chapText.replaceAll('\n ', '\n');
    chapText = chapText.replaceAll(' \n', '\n');

    chapText = chapText.split("");

    // Don't allow first character to be whitespace
    while (chapText[0] == "\n" || chapText[0] == " ") {
        chapText.splice(0, 1);
    }

    // Don't allow last character to be whitespace
    while (chapText[chapText.length - 1] == "\n" || chapText[chapText.length - 1] == " ") {
        chapText.splice(chapText.length - 1, 1);
    }            

    chapText = chapText.join("");

    while (chapText.includes("\n\n")) {
        chapText = chapText.replaceAll('\n\n', '\n');
    }

    chapText = chapText.replaceAll("\n", "\n ").replace(/  +/g, ' ').split(" ");

    return chapText;
    // -------------------------------------------------------------
}

async function deleteBook(event, bookName) {
    event.sender.send("start-loading");
    let path = `library/${bookName}`;
    if (fs.existsSync(path)) {
        await fs.rmdirSync(path, { recursive: true });
        event.sender.send("remove-from-library", bookName);
        event.sender.send("stop-loading");
    }
}

function getDataFromJSON(dir) {
    if (dir.substring(0, 8) != 'library/') dir = 'library/' + dir;
    return JSON.parse(fs.readFileSync(dir));
}

function getBookStats(bookName) {
    return JSON.parse(fs.readFileSync(`./library/${bookName}/typing-stats.json`));
}

function getBookData(bookName) {
    return JSON.parse(fs.readFileSync(`./library/${bookName}/meta-data.json`));
}

async function saveBookStats(stats) {
    let bookStatsJSON = JSON.stringify(stats);
    if (fs.existsSync(`./library/${stats.bookName}`))
        fs.writeFileSync(`./library/${stats.bookName}/typing-stats.json`, bookStatsJSON);
}

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

function getSettings() {
    return JSON.parse(fs.readFileSync("./settings.json"));
}

function saveSettings(settings) {
    let settingsJSON = JSON.stringify(settings);
    fs.writeFileSync("./settings.json", settingsJSON)
}

function defaultSettings() {
    let settings = new Settings();
    saveSettings(settings);
}

// Gets all books previously added and adds them to library
async function loadLibrary() {
    let dir = await fs.promises.opendir('library/')
    for await (const child of dir) {
        if (child.isDirectory())
            addLibraryBook(child);
    }
}

// Add book to library from path
function addLibraryBook(bookDir) {
    coverImagePath = `library/${bookDir.name}/cover.png`
    jsonPath = `library/${bookDir.name}/meta-data.json`;
    if (fs.existsSync(coverImagePath) && fs.existsSync(jsonPath)) {
        data = JSON.parse(fs.readFileSync(jsonPath));

        libraryElem = document.getElementById("library");
        newBook = document.createElement("div");
        newBook.classList.add("book-choice");
        newBook.setAttribute("id", bookDir.name);
        newBook.innerHTML = `<div class="cover-img-wrapper">
                                <img id="cover-img" src='${data.coverImg}'>
                            </div>
                            <div class="title-wrapper">
                                <label id="book-title">${data.title}</label>
                            </div>
                            <div class="book-buttons">
                                <i class="fas fa-keyboard"></i>
                                <i class="fas fa-chart-bar"></i>
                                <i class="fas fa-trash-alt"></i>
                            </div>`

        // TODO: book settings, cover image, title, etc.

        newBook.querySelector('.fa-keyboard').onclick = () => {
            ipcRenderer.send('init-typing', bookDir.name)
        }

        newBook.querySelector('.fa-trash-alt').onclick = () => {
            ipcRenderer.send("warn-delete-book", bookDir.name, data.title);
        }

        newBook.querySelector('.fa-chart-bar').onclick = () => {
            ipcRenderer.send('load-info', bookDir.name);
        }

        libraryElem.prepend(newBook);
    }
}

function removeLibraryBook(bookName) {
    bookDiv = document.getElementById(bookName);
    bookDiv.parentNode.removeChild(bookDiv);
}


// saveSettings({
//     smoothCaret: true,
//     wordCount: 150,
// })

exports.createBook = createBook;
exports.getDataFromJSON = getDataFromJSON;
exports.getSettings = getSettings;
exports.saveSettings = saveSettings;
exports.loadLibrary = loadLibrary;
exports.addLibraryBook = addLibraryBook;
exports.getBookStats = getBookStats;
exports.getBookData = getBookData;
exports.saveBookStats = saveBookStats;
exports.deleteBook = deleteBook;
exports.removeLibraryBook = removeLibraryBook;
exports.defaultSettings = defaultSettings;