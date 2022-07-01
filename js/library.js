const StreamZip = require('node-stream-zip');
// wish i didn't have to use both, but seems most optimal as of rn
const {
    parse
} = require("node-html-parser");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const path = require("path");
const fs = require('fs');
const {
    dialog,
    ipcRenderer,
    app
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
    var mobi;
    
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
            const encryptionDoc = new JSDOM(encryptionXML).window.document;

            for (let elem of encryptionDoc.getElementsByTagName('encryptionmethod')) {
                if (elem.getAttribute('Algorithm') != 'http://www.idpf.org/2008/embedding') {
                    zip.close();
                    event.sender.send("drm-error");
                    return;
                }
            }
        }
    } else if (fileType == '.mobi') {
        let data = fs.readFileSync(epubDir).buffer;
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

    let epubLibDir = `library/${path.parse(epubDir).name}/`
    let coverImagePath = epubLibDir + "cover.png";
    let jsonPath = epubLibDir + "meta-data.json";

    if (fs.existsSync(epubLibDir)) {
        if (fs.existsSync(jsonPath) && fs.existsSync(coverImagePath)) {
            event.sender.send('book-exists');
            return;
        } else {
            fs.rmSync(epubLibDir, {
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
        const containerXML = (await zip.entryData('META-INF/container.xml')).toString();
        const containerDoc = new JSDOM(containerXML).window.document;
        const opfDir = containerDoc.getElementsByTagName("rootfile")[0].getAttribute("full-path");

        // Get cover file from rootfile
        const opfData = (await zip.entryData(opfDir)).toString();
        const opfDoc = new JSDOM(opfData).window.document;
        

        let coverMeta;
        for (let meta of opfDoc.getElementsByTagName("meta")) {
            if (meta.getAttribute("name") == "cover") {
                coverMeta = meta.getAttribute("content");
            }
        }

        let coverImageFile = opfDoc.getElementById(coverMeta).getAttribute("href");

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
        for (let itemref of opfDoc.getElementsByTagName("spine")[0].getElementsByTagName("itemref")) {
            let idref = itemref.getAttribute("idref");
            let chapHTMLPath = opfDoc.getElementById(idref).getAttribute("href");
            let chapHTMLString = await (await zip.entryData(path.join(opfDir + `/../${chapHTMLPath}`).replace(/\\/g, "/"))).toString();
            let chapDoc = parse(chapHTMLString);
            let chapText = chapDoc.querySelector("body").innerText;

            chapText = readyText(chapText);

            if (chapText != "") {

                let chapTextPath = chaptersDir + `${chapCount}.json`;
                let chapTextJson = JSON.stringify(chapText);

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
        let imgExt = path.extname(coverImageFile);
        if (imgExt == ".xhtml" || imgExt == ".html") {
            let coverDoc = parse((await zip.entryData(path.join(`${opfDir}/../`, coverImageFile).replaceAll("\\", "/"))).toString());
            let newHTML = "";
            let extractedImageCount = 0;
            for (let elem of coverDoc.querySelector('body').querySelectorAll("*")) {
                let text = readyText(elem.innerText).join(" ");
                if (text != "") {
                    newHTML += `<${elem.tagName}>${text}</${elem.tagName}>`;
                }

                if (elem.tagName == "IMG") {
                    let newImgPath = path.join(epubLibDir, `images/`)
                    if (!fs.existsSync(newImgPath)) {
                        fs.mkdirSync(newImgPath);
                    }

                    let src = elem.getAttribute("src");
                    let imgPath;
                    if (src.startsWith("data:image")) {
                        let imgData = src.split(",")[1];
                        imgPath = path.join(newImgPath, `${extractedImageCount}.png`);
                        fs.writeFileSync(imgPath, Buffer.from(imgData, "base64"));
                        elem.setAttribute("src", imgPath.toString());
                        extractedImageCount++;
                    } else {
                        imgPath = path.join(`${opfDir}/../`, elem.getAttribute("src")).replaceAll("\\", "/");
                        await zip.extract(imgPath, newImgPath);
                    }

                    newImgPath = path.join(process.cwd(), newImgPath, path.parse(imgPath).base);
                    newHTML += `<img src="${newImgPath}" />`;
                }
            }

            metaData.coverHTML = newHTML;
        } else if (['.jpg', '.png', '.jpeg'].includes(imgExt)) {
            let zippedCoverPath = path.join(opfDir + "/../" + coverImageFile);
            await zip.extract(zippedCoverPath.replace(/\\/g, "/"), coverImagePath.replace(/\\/g, "/"));
            metaData.coverImage = coverImagePath;
        } else {
            console.log(imgExt);
            event.sender.send('console-log', "Cover image is not a valid image type");
            event.sender.send("console-log", imgExt)
        }

        await zip.close();


    } else if (fileType == '.txt') {
        let chapText = fs.readFileSync(epubDir, 'utf8');
        chapText = readyText(chapText);

        let chapTextPath = chaptersDir + `0.json`;
        let chapTextJson = JSON.stringify(chapText);

        fs.writeFileSync(chapTextPath, chapTextJson);

        let epubText = [chapTextPath];

        metaData = {
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
        let html = mobi.read_text();
        let book_data = mobi.get_book_data();

        let title = book_data.title;
        let author = book_data.author;

        metaData = {
            "title": title,
            "author": author,
            "dateStarted": new Date(),
            "division": "Page"
        }

        // TODO: options (first page, first image, custom image)
        let coverImage = mobi.get_cover_image();
        if (coverImage) {
            fs.writeFileSync(coverImagePath, coverImage, 'binary');
            metaData.coverImage = coverImagePath;
        }

        let textDoc = parse(html);

        let chapCount = 0;
        let epubText = [];
        let chapText = "";
        let chapHTML = "";
        let extractedImageCount = 0;

        let lastChild = textDoc.querySelector("body").lastChild;
        for (let elem of textDoc.querySelector("body").childNodes) {
            chapText += elem.innerText;
            chapText += " ";

            if (chapCount == 0 && !coverImage) {
                let text = readyText(elem.innerText).join(" ");
                // Adds all text elements to cover snapshot
                if (text != "") {
                    chapHTML += `<${elem.tagName}>${text}</${elem.tagName}>`;
                }

                // gets image elements from elem
                let imgElems = [];
                if (elem.tagName == "IMG") {
                    imgElems.push(elem);
                } else if (elem.querySelectorAll('img').length > 0) {
                    imgElems = elem.querySelectorAll('img');
                }
                
                // extracts images from elem and adds to snapshot
                for (let imgElem of imgElems) {
                    let newImgPath = path.join(epubLibDir, `images/`)
                    if (!fs.existsSync(newImgPath)) {
                        fs.mkdirSync(newImgPath);
                    }
                
                    let imgPath = path.join(newImgPath, `${extractedImageCount}.png`);
                    let src = imgElem.getAttribute("src");
                    
                    if (!src && imgElem.getAttribute("recindex")) {
                        let imageBinary = mobi.read_image(imgElem.getAttribute("recindex") - 1);
                        fs.writeFileSync(imgPath, imageBinary, 'binary');
                    } else {
                        if (src.startsWith("data:image")) {
                            let imgData = src.split(",")[1];
                            fs.writeFileSync(imgPath, Buffer.from(imgData, "base64"));
                            imgElem.setAttribute("src", imgPath.toString());
                            extractedImageCount++;
                        } // other image types?
                    }
                    
                    chapHTML += `<img src="${path.join(process.cwd(), imgPath)}" />`;
                }
            }

            // next page on page break
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

        metaData.textPath = epubText;
        if (chapHTML != "") {
            metaData.coverHTML = chapHTML;
        }
    }

    let bookStats = new BookStats(path.parse(epubDir).name);
    await saveBookStats(bookStats);

    let dataJSON = JSON.stringify(metaData);
    fs.writeFileSync(jsonPath, dataJSON);

    return path.parse(epubDir);
}

function restartBook(book) {
    let bookStats = getBookStats(book);
    let defaultStats = new BookStats();
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

    chapText = chapText.replaceAll("\n", "\n ").replace(/  +/g, ' ')
    chapText = chapText.replace(/[\t\r\v\f\b\0]/g, '');
    chapText = chapText.split(" ");

    return chapText;
    // -------------------------------------------------------------
}

async function deleteBook(event, bookName) {
    event.sender.send("start-loading");
    let path = `library/${bookName}`;
    if (fs.existsSync(path)) {
        fs.rmSync(path, {
            recursive: true
        });
        event.sender.send("remove-from-library", bookName);
        event.sender.send("stop-loading");
        let settings = getSettings();

        if (settings.currentBook == bookName) {
            delete settings.currentBook;
            saveSettings(settings);
        }
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
    return settings;
}

// Gets all books previously added and adds them to library
// todo: alphabetize
async function loadLibrary() {
    let dir = await fs.promises.opendir('library/')
    for await (const child of dir) {
        if (child.isDirectory())
            addLibraryBook(child);
    }
}

// Add book to library from path
function addLibraryBook(bookDir) {
    let data, cover;
    let jsonPath = `./library/${bookDir.name}/meta-data.json`;
    if (fs.existsSync(jsonPath)) {
        data = JSON.parse(fs.readFileSync(jsonPath));
    } else {
        console.error("Could not find book at: ", jsonPath);
        return;
    }

    if (data.coverImage) {
        if (fs.existsSync(data.coverImage)) {
            cover = `<img id="cover-img" src='${path.resolve(data.coverImage)}'>`;
        } else {
            console.error("Book "+bookDir.name+" is missing its alleged cover image ("+data.coverImage+")");
            return;
        }
    } else if (data.coverHTML) {
        cover = `<div class="html-img">${data.coverHTML}</div>`;
    }

    if (cover) {

        let libraryElem = document.getElementById("library");
        let newBook = document.createElement("div");
        newBook.classList.add("book-choice");
        newBook.setAttribute("id", bookDir.name);


        newBook.innerHTML = `<div class="cover-img-wrapper">
                                ${cover}
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

        if (data.coverStyle) {
            for (let style of data.coverStyle) {
                newBook.style[style[0]] = style[1];
            }
        }


        // todo: alphabetize instead
        libraryElem.prepend(newBook);

        // Sizing only for when there isn't a cover image. Otherwise, css can handle the sizing.
        // poorly named, oops
        if (data.coverHTML) {
            let htmlImg = newBook.querySelector('.html-img');
            htmlImg.style.opacity = 0;
            
    
            // set size after 0.1s to allow for image to load, 
            // would love for it to load when the div is ready, but idk how
            setTimeout(() => {
                let imgRect = htmlImg.getBoundingClientRect();
                let imgWrapperRect = libraryElem.getElementsByClassName("cover-img-wrapper")[0].getBoundingClientRect();
    
                let widthOffset = imgRect.width - imgWrapperRect.width;
                let heightOffset = imgRect.height - imgWrapperRect.height;
                let ratio;
                if (widthOffset > heightOffset && widthOffset > 0) {
                    ratio = imgWrapperRect.width / imgRect.width;
                } else if (heightOffset > widthOffset && heightOffset > 0) {
                    ratio = imgWrapperRect.height / imgRect.height;
                } else return;
                let newHeight = imgRect.height * ratio;
                htmlImg.style.marginTop = `${(imgWrapperRect.height - newHeight) / 2}px`;
    
                htmlImg.style.transform = `scale(${ratio})`;
                htmlImg.style.opacity = '1';
            }, 100);
        }
    }
}

function removeLibraryBook(bookName) {
    let bookDiv = document.getElementById(bookName);
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
exports.restartBook = restartBook;
