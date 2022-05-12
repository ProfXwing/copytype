// TODO: make this file smaller
import {
    showDialog
} from "./dialogs.js";
import {
    startTimer,
    stopTimer,
    updateStats,
    timerStarted
} from "./timer.js";

class WrongSpace {}


export var currentBookStats;
var currentBookData;

var fullText;
var text = [];
var typed = [];

var currentPage = 0;
var pageLengths = {
    /* pageNum: {
        chapter,
        startPos,
        endPos
    } */
};

export var settings = window.electron.getSettings();

var caretPosX;
var caretPosY;


var stopTimerEvent = setTimeout(() => {
    stopTimer();
}, 5000);

setInterval(() => {
    updateStats()
}, 450);

var showChapterEvent;




const accents = [
    ["áàâäåãąą́āą̄ă", "a"],
    ["éèêëẽęę́ēę̄ėě", "e"],
    ["íìîïĩįį́īį̄", "i"],
    ["óòôöøõóōǫǫ́ǭő", "o"],
    ["úùûüŭũúūůű", "u"],
    ["ńň", "n"],
    ["çĉčć", "c"],
    ["ř", "r"],
    ["ď", "d"],
    ["ťț", "t"],
    ["æ", "ae"],
    ["œ", "oe"],
    ["ẅŵ", "w"],
    ["ĝğg̃", "g"],
    ["ĥ", "h"],
    ["ĵ", "j"],
    ["ńñ", "n"],
    ["ŝśšș", "s"],
    ["żźž", "z"],
    ["ÿỹýÿŷ", "y"],
    ["łľ", "l"],
    ["أإآ", "ا"],
    ["َ", ""],
    ["ُ", ""],
    ["ِ", ""],
    ["ْ", ""],
    ["ً", ""],
    ["ٌ", ""],
    ["ٍ", ""],
    ["ّ", ""],
];


if (settings.currentBook) {
    initTyping(settings.currentBook);
}

window.onload = function () {
    $("#main-page").removeClass("hidden");

    // For easier refreshing
    // initTyping("Great_Expectations/chapters/2.json");
    if (settings.currentBook) {
        switchContent("#typing");
        nextWordSet(true);

    } else {
        switchContent("#library");
    }
}

// Page switcher
export function switchContent(div) {
    for (let child of $("#middle").children()) {
        $(child).addClass("hidden");
    }

    $("#no-book-warning").addClass("hidden");

    $(div).removeClass("hidden");
}

// Gets current letters on screen.
// Seems unnecessary
// function getWordsOnScreen() {
//     let currentTyped = "";

//     for (let child of $('#words').find(".word")) {
//         for (let letter of $(child).children()) {
//             if (letter.innerHTML == `<i class="fas fa-angle-down"></i>`) {
//                 currentTyped += "\n";
//             } else {
//                 currentTyped += letter.innerHTML;
//             }

//         }
//         if ($(child).get()[0] != $('#words').find('.word').last().get()[0]) {
//             currentTyped += " ";
//         }
//     }

//     return currentTyped;
// }

function getShownWordText(index) {
    let shownWord = "";
    for (let letter of $("#words").find(".word").eq(index).children()) {
        shownWord += letter.getAttribute('char');
    }
    return shownWord;
    // $("#words").find(".word").eq(currentTypedWords.length - 1).text()
}

export function getCorrectChars() {
    let correctChars = 0;
    for (let word in getTypedAsWords()) {
        let typedWord = getTypedAsWords()[word];
        if (typedWord == text[word] || settings.blindMode) {
            correctChars += typedWord.length;
        }

        // if there's a space after the word (word isn't last word)
        if (word + 1 <= typed.length - 1)
            correctChars++;
    }
    return correctChars;
}

// this sucks i think but i dont care rn
// Updates the caret position 
function updateCaret(init = false) {
    if (typed.length == 0 && !$('#caret').hasClass('animate-caret')) {
        $('#caret').addClass("animate-caret");
    } else if (typed.length > 0 && $('#caret').hasClass('animate-caret')) {
        $('#caret').removeClass("animate-caret");
    }

    if ($("#words").find(".word").length) {
        let typedWords = getTypedAsWords();
        let currentWord = typedWords[typedWords.length - 1].split("");
        let typedWordsLength = typedWords.length - 1;
        let currentWordLength = currentWord.length - 1;

        if (typedWords.length == 0) {
            typedWordsLength = 0;
        }
        if (currentWord.length == 0) {
            currentWordLength = 0;
        }

        let lettersList = $("#words").find(".word").eq(typedWordsLength).children();
        let lastLetter;
        if (currentWord.length > lettersList.length) {
            lastLetter = lettersList.eq(lettersList.length - 1);
        } else {
            lastLetter = lettersList.eq(currentWordLength);
        }
        // let lastLetter = $("#words").find("div").eq(typedWordsLength).children().eq(currentWordLength);

        let charPosition = lastLetter.position(); //typed.length - 1 + getSkippedLetters()
        let width = lastLetter.width()

        let caret = $("#caret");

        if (typed.length == 0) {
            width = 0;
            charPosition = $("#words").find("div").eq(0).children().eq(0).position();
        }

        if (settings.caretStyle == "default") {
            caretPosX = (currentWord.length == 0) ? charPosition.left - caret.width() : charPosition.left + width;
        } else {
            caretPosX = (currentWord.length == 0) ? charPosition.left : charPosition.left + width;
        }

        caretPosY = charPosition.top;

        if (init) {
            caret.stop(true, true);
            caret.css("left", caretPosX);
            caret.css("top", caretPosY);
        } else {
            let duration = (settings.smoothCaret) ? 100 : 0;

            caret.stop(true, false).animate({
                left: caretPosX,
                top: caretPosY
            }, duration);
        }

        
    }
}

// clears loaded book
export function stopTyping() {
    stopTimer();
    $("#typing-stats").addClass("hidden");
    $("#wpm-counter").addClass("hidden");
    $("#acc-counter").addClass("hidden");
    $("#page-selectors").addClass('hidden');
    $("#chapter-label").addClass("hide-chapter-label")
    $("#words").empty();

    currentBookStats = undefined;
    currentBookData = undefined;

    typed = [];
    fullText = undefined;
}

// Initializes typing screen
export function initTyping(book) {
    settings.currentBook = book;
    window.electron.saveSettings(settings);

    // saves in case another book is loaded
    saveTyping();

    if (settings.wpmCounter || settings.accCounter) {
        $("#typing-stats").removeClass("hidden");
    }
    if (settings.wpmCounter) {
        $("#wpm-counter").removeClass("hidden");
    }
    if (settings.accCounter) {
        $("#acc-counter").removeClass("hidden");
    }

    $("#page-selectors").removeClass('hidden');

    currentBookStats = window.electron.getBookStats(book);
    currentBookData = window.electron.getBookData(book);

    if (!currentBookStats.startedBook) $("#chapter-label").removeClass("hide-chapter-label");
    changeDivisionText();

    typed = []
    fullText = window.electron.getDataFromJSON(currentBookData.textPath[currentBookStats.chapter]); // .slice(currentBookStats.typedPos);
    currentBookStats.sessions++;

    nextWordSet(true);
    switchContent("#typing");
}


export function continueTyping() {
    switchContent("#typing");
    if (!currentBookStats) {
        $("#no-book-warning").removeClass("hidden");
    } else {
        nextWordSet(true);
    }
}

export async function saveTyping() {
    if (currentBookStats) {
        stopTimer();
        // Bookmark
        currentBookStats.typedPos += getTypedAsWords().length - 1;
        currentBookStats.wpm.correctChars += getCorrectChars();
        await window.electron.saveBookStats(currentBookStats);
    }
}

function hideWords() {
    $("#words").css("height", 0);
}

function showWords() {
    $("#words").css("height", "auto");
}

function showChapterLabel() {
    changeDivisionText();
    $("#chapter-label").removeClass("hide-chapter-label");
    clearTimeout(showChapterEvent);
    showChapterEvent = setTimeout(() => {
        $("#chapter-label").addClass("hide-chapter-label")
    }, 2000)
}

function changeDivisionText() {
    if (currentBookData.division != "") {
        $("#chapter-label").text(`${currentBookData.division} ${currentBookStats.chapter + 1}`);
    }
}

export function prevButton() {
    if (!currentBookStats.startedBook && currentBookStats.chapter != 0) {
        currentBookStats.chapter--;
        changeDivisionText();
        fullText = window.electron.getDataFromJSON(currentBookData.textPath[currentBookStats.chapter]);
        nextWordSet(true);
    } else prevWordSet();
}

export function nextButton() {
    if (!currentBookStats.startedBook && currentBookStats.chapter != currentBookData.textPath.length - 1) {
        currentBookStats.chapter++;
        changeDivisionText();
        fullText = window.electron.getDataFromJSON(currentBookData.textPath[currentBookStats.chapter]);
        nextWordSet(true);
    } else nextWordSet();
}

// TODO: inconsistent page lengths going next/prev by 2. idk
// UPDATE: almost fully implemented. needs testing, 
// seems like it's still inconsistent at times? try resizing window

/* probably how to fix: make var with {
    pageNumber: {startPos, endPos}
}

when you switch pages, check this object first for positions. 
when window resizes and other book is initialized, reset object

*/


function prevWordSet() {
    typed = [];
    currentPage--;
    if (currentBookStats.typedPos == 0) {
        currentBookStats.chapter--;
        showChapterLabel();
        fullText = window.electron.getDataFromJSON(currentBookData.textPath[currentBookStats.chapter]);
        currentBookStats.typedPos = fullText.length;
    }

    if (Object.keys(pageLengths).includes(currentPage.toString())) {
        if (currentBookStats.chapter != pageLengths[currentPage].chapter) {
            currentBookStats.chapter = pageLengths[currentPage].chapter;
            showChapterLabel();
            fullText = window.electron.getDataFromJSON(currentBookData.textPath[currentBookStats.chapter]);
        }

        currentBookStats.typedPos = pageLengths[currentPage].startPos;
        text = fullText.slice(pageLengths[currentPage].startPos);
        text.splice(pageLengths[currentPage].endPos - pageLengths[currentPage].startPos);
    } else {
        let startPos = currentBookStats.typedPos;
        currentBookStats.typedPos -= settings.wordCount;
        if (currentBookStats.typedPos < 0) currentBookStats.typedPos = 0;
        text = fullText.slice(currentBookStats.typedPos);
        text.splice(startPos - currentBookStats.typedPos);
    }

    if (settings.lazyMode) {
        let new_text = [];
        for (let word of text) {
            new_text.push(replaceAccents(word));
        }
        text = new_text;
    }


    hideWords();

    $("#words").empty();

    for (let word of text) {
        $("#words").append(`<div class="word"></div>`);
        let children = $("#words").children();
        let currentWord = children[children.length - 1];

        for (let char of word) {
            if (char == "\n") {
                $(currentWord).append(`<letter char='${char}' class="nlChar"><i class="fas fa-angle-down"></i></letter>`);
                $("#words").append("<br>");
            } else {
                $(currentWord).append(`<letter char='${char}'>${char}</letter>`);
            }
        }
    }

    $("#words").append("<div id='caret'></div>");

    // Once the list of words has loaded, remove the words that aren't on the screen 
    $("#caret").ready(function () {
        while ($("#words .word:last").position().top > $(window).height() - 120) {
            $("#words .word").first().remove();
            text.shift();
            if ($("#words").children().first().prop("nodeName") == "BR") {
                $("#words").children().first().remove();
            }
            currentBookStats.typedPos++;
        }

        if (!Object.keys(pageLengths).includes(currentPage.toString())) {
            setPageLengths();
        }

        // windowResize();
        updateCaret(true);
        showWords();
    });
}


export function nextWordSet(keepCurrent = false) {
    stopTimer();
    if (!keepCurrent) {
        currentPage++;
        currentBookStats.wpm.correctChars += getCorrectChars();
        currentBookStats.typedPos += text.length;
        typed = [];
    } else pageLengths = {};

    if (currentBookStats.typedPos >= fullText.length - 1) {
        if (currentBookStats.chapter == currentBookData.textPath.length - 1) {
            // makes sure dialog is ready
            $("#book-finished").ready(() => {
                showDialog('book-finished');
            })
        } else {
            currentBookStats.chapter++;
            showChapterLabel();
            currentBookStats.typedPos = 0;
            fullText = window.electron.getDataFromJSON(currentBookData.textPath[currentBookStats.chapter]);
        }
    }


    if (Object.keys(pageLengths).includes(currentPage.toString())) {
        if (currentBookStats.chapter != pageLengths[currentPage].chapter) {
            currentBookStats.chapter = pageLengths[currentPage].chapter;
            showChapterLabel();
            fullText = window.electron.getDataFromJSON(currentBookData.textPath[currentBookStats.chapter]);
        }

        currentBookStats.typedPos = pageLengths[currentPage].startPos;
        text = fullText.slice(pageLengths[currentPage].startPos);
        text.splice(pageLengths[currentPage].endPos - pageLengths[currentPage].startPos);

    } else {
        text = fullText.slice(currentBookStats.typedPos)
        text.splice(settings.wordCount);
    }

    if (settings.lazyMode) {
        let new_text = [];
        for (let word of text) {
            new_text.push(replaceAccents(word));
        }
        text = new_text;
    }


    hideWords();
    $("#words").empty();
    for (let word of text) {
        $("#words").append(`<div class="word"></div>`);
        let children = $("#words").children()
        let currentWord = children[children.length - 1];

        for (let char of word) {
            if (char == "\n") {
                $(currentWord).append(`<letter char='${char}' class="nlChar"><i class="fas fa-angle-down"></i></letter>`);
                $("#words").append("<br>");
            } else {
                $(currentWord).append(`<letter char='${char}'>${char}</letter>`);
            }
        }

    }

    // Styles words that are already typed
    if (keepCurrent) {
        let currentTyped = getTypedAsWords();
        for (let wordIndex = 0; wordIndex < currentTyped.length; wordIndex++) {
            let letterCount = currentTyped[wordIndex].length - 1;
            
            for (let letterIndex = 0; letterIndex <= letterCount; letterIndex++) {
                styleWord(wordIndex, letterIndex);
            }

            if (letterCount == -1) {
                styleWord(wordIndex, 0);
            }

        }

        // if (currentTyped[currentTyped.length - 1].length == 0) {
        //     checkError(currentTyped.length - 2);
        // }

        // if (settings.highlightMode == 'letter') {
        //     let words = $("#words").find(".word");
        //     let currentTyped = getTypedAsWords();
        //     for (let i = 0; i < currentTyped.length; i++) {
        //         let word = $(words[i]);

        //         if (i != currentTyped.length - 1 && currentTyped[i] != text[i] && !settings.blindMode) {
        //             word.addClass("error");
        //         }


        //         let letters = word.find("letter");
        //         for (let j = 0; j < letters.length; j++) {
        //             if (j > currentTyped[i].length - 1 && !(settings.blindMode && i != currentTyped.length - 1)) {
        //                 break;
        //             }
        //             if (currentTyped[i].charAt(j) != text[i].charAt(j) && !settings.blindMode) {
        //                 $(letters[j]).addClass("incorrect");
        //             } else {
        //                 $(letters[j]).addClass("correct");
        //             }
        //         }

        //         while (word.find("letter").length < currentTyped[i].length) {

        //             // letter should be the next letter to add
        //             // next letter to add should use word.find("letter").length, as that is the amount of letters currently added
        //             let letter = currentTyped[i].charAt(word.find("letter").length)
        //             if (letter == "\n" || letter == " ") {
        //                 letter = "_";
        //             }

        //             word.append($(`<letter class="incorrect">${letter}</letter>`))
        //         }
        //     }
        // } else if (settings.highlightMode == 'word') {
        //     checkWholeWordErrors();
        //     if (!settings.blindMode) {
        //         let wordIndex = 0;
        //         while (wordIndex <= getTypedAsWords().length - 2) {
        //             checkError(wordIndex);
        //             wordIndex++;
        //         }
        //     }
        // }
    }

    $("#words").append(`<div id='caret' class='${settings.caretStyle}'></div>`);

    // Once the list of 100 words has loaded, remove the words that aren't on the screen 
    $("#caret").ready(function () {
        removeWordsOffScreen();

        if (!Object.keys(pageLengths).includes(currentPage.toString())) {
            setPageLengths();
        }

        // windowResize();
        updateCaret(true);
        showWords();
    });
}

function removeWordsOffScreen() {
    for (let child of $("#words").find("div").toArray().reverse()) {
        if ($(child).position().top > $(window).height() - 120 && $(child).attr('id') != "caret") {
            child.remove();
            text.pop();
            if ($("#words").children().eq(-2).prop("nodeName") == "BR") {
                $("#words").children().eq(-2).remove();
            }
        }
    }
}

function setPageLengths() {
    pageLengths[currentPage] = {
        startPos: currentBookStats.typedPos,
        endPos: currentBookStats.typedPos + text.length,
        chapter: currentBookStats.chapter
    }
}

// Checks if you can type
function canType(key) {
    let currentTypedWords = getTypedAsWords();

    if (key == " " && currentTypedWords.length + 1> text.length) {
        currentBookStats.accuracy.typedChars++;
        currentBookStats.accuracy.correctChars++;
        currentBookStats.wpm.correctChars++;
        nextWordSet();
        updateCaret();
        return false;
    }

    let typedWord = currentTypedWords[currentTypedWords.length - 1];
    let correctWord = text[currentTypedWords.length - 1];

    if (key == "Enter" && correctWord[typedWord.length] != "\n") {
        return false;
    }

    if (settings.stopOnError == "letter") {
        let typedLetter = key;
        if (key == "Enter") typedLetter = "\n";
        if (!(typedWord.length == correctWord.length && typedLetter == " ")) {
            if (correctWord[typedWord.length] != typedLetter) {
                currentBookStats.accuracy.typedChars++;
                return false;
            }
        }
    }

    let keyNotSpace = true;
    if (key == " " && !settings.strictSpace && settings.stopOnError != "word") {
        keyNotSpace = false;
    }
    if (!$("#words").hasClass("hidden") && (typedWord.length - correctWord.length != 20 || key == " ") &&
        (typedWord.length > 0 || (keyNotSpace && key != "Enter") || correctWord[0] == "\n")) {
        return true;
    }

    if (typedWord.length - correctWord.length == 20) {
        currentBookStats.accuracy.typedChars++;
    }
    return false;
}

function checkCorrect() {
    let typedWords = getTypedAsWords();
    let typedWord = typedWords[typedWords.length - 1];
    let typedLetter = typedWord[typedWord.length - 1];

    let correctWord = text[typedWords.length - 1];
    let correctLetter = correctWord[typedWord.length - 1];

    currentBookStats.accuracy.typedChars++;
    // this counts space as correct because they are both undefined in this case. probably bad to rely on that.
    if (typedLetter == correctLetter) {
        currentBookStats.accuracy.correctChars++;
    }
}

function styleWord(wordIndex=getTypedAsWords().length - 1, letterIndex) {
    let typedWords = getTypedAsWords();
    let typedWord = typedWords[wordIndex].split("");

    if (letterIndex == undefined) {
        letterIndex = typedWord.length - 1;
    }

    let typedLetter = typedWords[wordIndex][letterIndex];

    let shownWord = $("#words").find("div").eq(wordIndex);
    let shownLetter = shownWord.children().eq(letterIndex);
    let lastShownWord = $("#words").find("div").eq(wordIndex - 1)

    let correctWord = text[wordIndex];
    let correctWordPart = correctWord.slice(0, typedWord.length);

    let correctLetter = correctWord[letterIndex];

    if (settings.highlightMode == "letter") {
        if (!settings.blindMode) {

            if (typedWord.length > 0) {
                if (typedLetter == correctLetter && !shownLetter.hasClass("correct") && shownLetter.html() != " ") {
                    shownLetter.addClass("correct");
                } else if (typedLetter != correctLetter && !shownLetter.hasClass("incorrect")) {
                    shownLetter.addClass("incorrect");
                    if (settings.indicateTypos == "below") {
                        shownLetter.append(`<hint>${typedLetter}</div>`);
                    } else if (settings.indicateTypos == "replace") {
                        shownLetter.text(typedLetter);
                    }
                }
            }
            checkError(wordIndex - 1);
        } else {
            if (typedWord.length > 0) {
                shownLetter.addClass("correct");
            }
            if (wordIndex >= 1) {
                for (let letter of lastShownWord.children()) {
                    $(letter).addClass("correct");
                }
            }
        }
    } else if (settings.highlightMode == "word") {
        for (let word of $("#words").find(".word")) {
            if (word != shownWord) {
                for (let letter of $(word).find('letter')) {
                    $(letter).removeClass("correct");
                }
            }
        }
        
        if (typedWord.join("") != correctWordPart && !settings.blindMode) {
            for (let letter of shownWord.find("letter")) {
                $(letter).removeClass("correct").addClass("incorrect");
            }
        } else {
            for (let letter of shownWord.find("letter")) {
                $(letter).removeClass("incorrect").addClass("correct");
            }
        }

        if (!settings.blindMode) {
            if (typedWord.length > 0) {

                if (typedLetter != correctLetter) {
                    if (settings.indicateTypos == "below") {
                        shownLetter.append(`<hint>${typedLetter}</div>`);
                    } else if (settings.indicateTypos == "replace") {
                        let newLetter = typedLetter;
                        if (typedLetter instanceof WrongSpace) {
                            newLetter = "_";
                        }
                        shownLetter.text(newLetter);
                        // lastShownLetter.removeClass("nlChar");
                    }
                }
            }

            checkError(wordIndex - 1);
        }
    }
}

// for highlightmode == "word"
// function checkWholeWordErrors() {
//     let typedAsWords = getTypedAsWords();
//     let typedWord = typedAsWords[typedAsWords.length - 1];
//     let correctWord = text[typedAsWords.length - 1]
//     let correctWordPart = correctWord.slice(0, typedWord.length)
//     let lastShownWord = $("#words").find("div").eq(typedAsWords.length - 1);

//     for (let word of $("#words").find(".word")) {
//         if (word != lastShownWord) {
//             for (let letter of $(word).find('letter')) {
//                 $(letter).removeClass("correct");
//             }
//         }
//     }

//     if (typedWord != correctWordPart && !settings.blindMode) {
//         for (let letter of lastShownWord.find("letter")) {
//             $(letter).removeClass("correct").addClass("incorrect");
//         }
//     } else {
//         for (let letter of lastShownWord.find("letter")) {
//             $(letter).removeClass("incorrect").addClass("correct");
//         }
//     }
// }




// Runs on keypress, adds key to typed list and styles screen appropriately
function typeKey(e) {
    if (text.length > 0) {
        if (canType(e.key) && !e.ctrlKey) {
            let typedAsWords = getTypedAsWords();
            let correctWord = text[typedAsWords.length - 1]
            let typedWord = typedAsWords[typedAsWords.length - 1];

            if (e.key == "Enter") {
                typed.push("\n");
                typedAsWords = getTypedAsWords();
                typedWord = typedAsWords[typedAsWords.length - 1];

            } else {
                if ((settings.strictSpace || settings.stopOnError == "word") && e.key == " " &&
                    typedWord.length == 0) {
                    typed.push(new WrongSpace());

                } else if (settings.stopOnError == "word" && e.key == " " &&
                    correctWord != typedWord) {
                    typed.push(new WrongSpace());
                } else {
                    typed.push(e.key);
                }
            }
            checkCorrect();

            let currentTypedWords = getTypedAsWords();


            // ---------------------- Letter styling (correct or wrong) ---------------------------
            let lastShownLetters = $("#words").find("div").eq(currentTypedWords.length - 1).children();

            if (['rgb', 'aurora', 'fire', 'trance'].includes(settings.currentTheme)) {
                for (let letter of lastShownLetters) {
                    if ($(letter).hasClass("correct")) {
                        $(letter).removeClass("correct");
                        $(letter).width();
                        $(letter).addClass("correct");
                    }
                }
            }

            if (settings.highlightMode == "letter") {
                styleWord();
            }

            if (e.key == "Enter") {
                if (settings.stopOnError == "word") {
                    if (correctWord == typedWord) {
                        typed.push(" ")
                    }
                } else {
                    typed.push(" ");
                }
            }

            currentTypedWords = getTypedAsWords();

            if (settings.highlightMode == "word") {
                styleWord();
            }

            if (!currentBookStats.startedBook) {
                currentBookStats.startedBook = true;
                $("#chapter-label").addClass("hide-chapter-label");
            }

            if (!timerStarted) {
                startTimer();
            }

            // probably shouldn't do this, but i'm gonna do it anyway 😈
            clearTimeout(stopTimerEvent);
            stopTimerEvent = setTimeout(() => {
                stopTimer(5000);
            }, 5000);


            // ------------------- Overtyping ---------------------------
            if (!settings.hideExtraLetters && !settings.blindMode) {
                typedWord = currentTypedWords[currentTypedWords.length - 1];

                correctWord = text[currentTypedWords.length - 1];
                let currentShownWord = getShownWordText(currentTypedWords.length - 1);

                if (typedWord.length > correctWord.length && typedWord.length > currentShownWord.length) {
                    console.log("overtyping?")
                    let letter = (e.key == "Enter") ? "_" : typedWord.substring(typedWord.length - 1);
                    let currentEndLetter = $("#words").find("div").eq(currentTypedWords.length - 1).children().eq(typedWord.split("").length - 2);

                    if (typed[typed.length - 1] instanceof WrongSpace) {
                        letter = "_";
                    }
                    $(`<letter char=${letter} class="incorrect extra">${letter}</letter>`).insertAfter(currentEndLetter);

                    removeWordsOffScreen();
                    setPageLengths();
                } else {
                    console.log(typedWord);
                    console.log(correctWord);
                    console.log(currentShownWord);
                }
            }
            // ---------------------------------------------------------------


            // windowResize();
            updateCaret();

        }
        if (e.key == " ") {
            e.preventDefault();
        }
    }
}

function checkError(index) {
    let currentTypedWords = getTypedAsWords();
    let lastTypedWord = currentTypedWords[index]
    let correctLastWord = text[index]
    let lastShownWord = $("#words").find("div").eq(index)
    
    if (lastTypedWord != correctLastWord) {
        lastShownWord.addClass("error");
    }
}

// Runs on keydown, used for removing letters
function checkKey(e) {
    function removeLetter() {
        // ------------------------- Removes letter styling -----------------------------------
        let currentTypedWords = getTypedAsWords();
        let currentTypedWordsLength = currentTypedWords.length - 1;
        let currentTypedWord = currentTypedWords[currentTypedWordsLength].split("");
        let correctLetter = text[currentTypedWordsLength][currentTypedWord.length - 1];
        let lastShownWord = $("#words").find("div").eq(currentTypedWordsLength);
        let lastShownLetter = lastShownWord.children().eq(currentTypedWord.length - 1);

        // Removes nlChar styling 
        if (currentTypedWord.length == 0 && typed[typed.length - 1] == "\n") {
            currentTypedWordsLength = currentTypedWords.length - 2;
            currentTypedWord = currentTypedWords[currentTypedWordsLength].split("");
            lastShownLetter = $("#words").find("div").eq(currentTypedWordsLength).children().eq(currentTypedWord.length);
        }


        if (settings.highlightMode == "letter") {
            lastShownLetter.removeClass("correct");
            lastShownLetter.removeClass("incorrect");
            lastShownLetter.find("hint").remove();
        }

        if (correctLetter == "\n") {
            lastShownLetter.html(`<i class="fas fa-angle-down"></i>`);
        } else if (lastShownLetter.text() != correctLetter) {
            lastShownLetter.html(correctLetter);
        }

        // ---------------------------------------------------------------------------------------

        typed.pop();

        if (settings.highlightMode == "word") {
            styleWord();
        }

        currentTypedWords = getTypedAsWords();
        currentTypedWordsLength = currentTypedWords.length - 1;
        currentTypedWord = currentTypedWords[currentTypedWordsLength].split("");

        if (settings.blindMode) {
            let newShownWord = $("#words").find("div").eq(currentTypedWordsLength);
            let wordChildren = newShownWord.children();
            for (let child of wordChildren.slice(currentTypedWord.length)) {
                $(child).removeClass("correct").removeClass("incorrect");
            }
        }


        let currentWordElement = $("#words").find("div").eq(currentTypedWords.length - 1);
        if (currentWordElement.hasClass("error")) {
            currentWordElement.removeClass("error");
        }


        // -------------------  Overtyping ----------------------------
        currentTypedWords = getTypedAsWords();
        let lastTypedWord = currentTypedWords[currentTypedWords.length - 1];

        let correctWord = text[currentTypedWords.length - 1];
        let currentShownWord = getShownWordText(currentTypedWords.length - 1);

        if (lastTypedWord.length >= correctWord.length && lastTypedWord.length < currentShownWord.length) {
            let currentEndLetter = $("#words").find("div").eq(currentTypedWords.length - 1).children().eq(currentShownWord.length - 1);
            currentEndLetter.remove();
        }
        // -------------------------------------------------------------
    }
    if (text.length > 0) {
        if (!$("#words").hasClass("hidden") && typed.length != 0) {
            let typedAsWords = getTypedAsWords();
            let currentWordLength = typedAsWords[typedAsWords.length - 1].length;
            let lastWord = $("#words").find(".word").eq(typedAsWords.length - 2);

            let hasError = false;
            for (let letter of lastWord.children()) {
                if ($(letter).hasClass("incorrect")) {
                    hasError = true;
                }
            }

            let toDelete = false;
            if (e.key == "Backspace") {
                if (settings.confidenceMode == "max") {
                    toDelete = false;
                } else if (settings.confidenceMode == "on") {
                    if (currentWordLength > 0 || hasError) {
                        toDelete = true;
                    }
                } else if (settings.confidenceMode == "off") {
                    toDelete = true;
                }
            }

            if (toDelete) {
                // Account for mac users because mac is quirky
                if ((window.electron.operatingSystem != 'darwin' && e.ctrlKey) || (window.electron.operatingSystem == 'darwin' && e.altKey)) {
                    let deleting = true;
                    let encounteredKey = false;

                    while (deleting) {
                        if (((typed[typed.length - 1] == " " || typed[typed.length - 1] == "\n") && encounteredKey) || typed.length == 0) {
                            deleting = false;
                        } else if (typed[typed.length - 1] != " ") {
                            encounteredKey = true;
                            removeLetter();
                        } else {
                            removeLetter();
                        }
                    }

                } else {
                    removeLetter();
                }
                updateCaret();
            }
        }
    }
}



document.addEventListener('keypress', typeKey);
document.addEventListener('keydown', checkKey);

// Caret is moved on window resize
$(window).resize(function () {
    if (currentBookStats) {
        nextWordSet(true);
    }
    if (!$("#words").hasClass("hidden")) {
        updateCaret();
    }
});


function getTypedAsWords() {
    let words = [""];
    for (let char of typed) {
        if (char instanceof WrongSpace) {
            words[words.length - 1] += " ";
        } else if (char == " ") {
            words[words.length] = "";
        } else {
            words[words.length - 1] += char;
        }
    }
    return words;
}

function replaceAccents(word) {
    let newWord = "";
    for (let char of word) {
        // check if char is uppercase
        let upper = false;
        if (char.toUpperCase() == char) {
            upper = true;
        }

        for (let accent of accents) {
            if (accent[0].split("").includes(char.toLowerCase())) {
                char = accent[1];
            }
        }

        if (upper) {
            char = char.toUpperCase();
        }
        newWord += char;
    }
    return newWord;
}