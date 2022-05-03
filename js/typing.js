// TODO: make this file smaller
// TODO: I might need to redo typed in a way that can use strict space and stop on word, maybe just redo .join("").split(" ") into its own function
import {
    showDialog
} from "./dialogs.js";
import {
    startTimer,
    stopTimer,
    updateStats
} from "./timer.js";

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

var timerStarted = false;

var stopTimerEvent = setTimeout(() => {
    timerStarted = false;
    stopTimer();
}, 5000);

var updateWPM = setInterval(() => {
    updateStats()
}, 450);

var showChapterEvent;

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

        let lastLetter = $("#words").find("div").eq(typedWordsLength).children().eq(currentWordLength);

        let charPosition = lastLetter.position(); //typed.length - 1 + getSkippedLetters()
        let width = lastLetter.width()

        let caret = $("#caret");

        if (typed.length == 0) {
            let initCaretPos = $("#words").find(".word").eq(0).find('letter').eq(0).position();
            if (init) {
                caret.css("left", initCaretPos.left - caret.width());
                caret.css("top", initCaretPos.top);
            }

            width = 0;
            charPosition = $("#words").find("div").eq(0).children().eq(0).position();
        }
        caretPosX = (currentWord.length == 0) ? charPosition.left - caret.width() : charPosition.left + width;
        caretPosY = charPosition.top;

        let duration = (settings.smoothCaret) ? 100 : 0;

        caret.stop(true, false).animate({
            left: caretPosX,
            top: caretPosY
        }, duration);
    }
}

function windowResize() {
    $("#typing").css("height", $(window).height() - document.getElementById("typing").getBoundingClientRect().top - 90);
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
        // console.log(currentBookStats);
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
    $("#chapter-label").text(`${currentBookData.division} ${currentBookStats.chapter + 1}`);
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

    hideWords();

    $("#words").empty();

    for (let word of text) {
        $("#words").append(`<div class="word"></div>`);
        let children = $("#words").children();
        let currentWord = children[children.length - 1];

        for (let char of word) {
            if (char == "\n") {
                $(currentWord).append(`<letter class="nlChar"><i class="fas fa-angle-down"></i></letter>`);
                $("#words").append("<br>");
            } else {
                $(currentWord).append(`<letter>${char}</letter>`);
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

        if (!Object.keys(pageLengths).includes(currentPage.toString()))
            pageLengths[currentPage] = {
                startPos: currentBookStats.typedPos,
                endPos: currentBookStats.typedPos + text.length,
                chapter: currentBookStats.chapter
            }

        // windowResize();
        updateCaret(true);
        showWords();
    });
}


export function nextWordSet(keepCurrent = false) {
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

    hideWords();
    $("#words").empty();
    for (let word of text) {
        $("#words").append(`<div class="word"></div>`);
        let children = $("#words").children()
        let currentWord = children[children.length - 1];

        for (let char of word) {
            if (char == "\n") {
                $(currentWord).append(`<letter class="nlChar"><i class="fas fa-angle-down"></i></letter>`);
                $("#words").append("<br>");
            } else {
                $(currentWord).append(`<letter>${char}</letter>`);
            }

        }
    }

    $("#words").append("<div id='caret'></div>");

    // Once the list of 100 words has loaded, remove the words that aren't on the screen 
    $("#caret").ready(function () {
        for (let child of $("#words").find("div").toArray().reverse()) {
            if ($(child).position().top > $(window).height() - 120 && $(child).attr('id') != "caret") {
                child.remove();
                text.pop();
                if ($("#words").children().eq(-2).prop("nodeName") == "BR") {
                    $("#words").children().eq(-2).remove();
                }
            }
        }
        console.log(text);

        if (!Object.keys(pageLengths).includes(currentPage.toString()))
            pageLengths[currentPage] = {
                startPos: currentBookStats.typedPos,
                endPos: currentBookStats.typedPos + text.length,
                chapter: currentBookStats.chapter
            }

        // windowResize();
        updateCaret(true);
        showWords();
    });
}

// Checks if you can type
function canType(key) {
    let currentTypedWords = getTypedAsWords();
    let typedWord = currentTypedWords[currentTypedWords.length - 1];
    let correctWord = text[currentTypedWords.length - 1];

    // Don't allow overtyping, essentially stop on letter at the end of the word, not the best idea
    // TODO: different overtyping solutions
    if (typedWord.length == correctWord.length && key != " ") {
        currentBookStats.accuracy.typedChars++;
        return false;
    }

    let keyNotSpace = true;
    if (key == " " && !settings.strictSpace) {
        keyNotSpace = false;
    }
    if (!$("#words").hasClass("hidden") && (typedWord.length - correctWord.length != 20 || key == " ") &&
        (typedWord.length > 0 || (keyNotSpace && key != "Enter") || correctWord[0] == "\n")) {
        return true;
    }

    return false;
}

function checkCorrect() {
    currentBookStats.accuracy.typedChars++;
    if (typed[typed.length - 1] == text.join(" ").split("")[typed.length - 1]) {
        currentBookStats.accuracy.correctChars++;
    }
}


// Runs on keypress, adds key to typed list and styles screen appropriately
function typeKey(e) {
    if (text.length > 0) {
        if (canType(e.key) && !e.ctrlKey) {
            if (e.key == "Enter") {
                typed.push("\n");

            } else {
                if (settings.strictSpace && e.key == " " && getTypedAsWords()[getTypedAsWords().length - 1].length == 0) {
                    typed.push(new WrongSpace());
                } else {
                    typed.push(e.key);
                }
            }
            checkCorrect();
            if (!currentBookStats.startedBook) {
                currentBookStats.startedBook = true;
                $("#chapter-label").addClass("hide-chapter-label");
            }

            if (!timerStarted) {
                startTimer();
                timerStarted = true;
            }

            // probably shouldn't do this, but i'm gonna do it anyway 😈
            clearTimeout(stopTimerEvent);
            stopTimerEvent = setTimeout(() => {
                timerStarted = false;
                stopTimer();
            }, 5000);

            // ---------------------- Letter styling (correct or wrong) ---------------------------
            let lastTypedLetter = typed[typed.length - 1];

            let currentTypedWords = getTypedAsWords();
            let currentTypedWord = currentTypedWords[currentTypedWords.length - 1].split("");

            let lastShownLetters = $("#words").find("div").eq(currentTypedWords.length - 1).children();
            let lastShownLetter = $("#words").find("div").eq(currentTypedWords.length - 1).children().eq(currentTypedWord.length - 1); //typed.length - 1 + getSkippedLetters()

            let lastCorrectLetter = text[currentTypedWords.length - 1][currentTypedWord.length - 1];


            if (['rgb', 'aurora', 'fire', 'trance'].includes(settings.currentTheme)) {
                for (let letter of lastShownLetters) {
                    if ($(letter).hasClass("correct")) {
                        $(letter).removeClass("correct");
                        $(letter).width();
                        $(letter).addClass("correct");
                    }
                }
            }

            // I don't remember what this does but it probably isn't needed
            // if (currentTypedWord.length == 0 && typed[typed.length - 1] == "\n" && textWithNewLine.join(" ")[typed.length - 1] == "\n") {
            //     let lastShownLetter = $("#words").find("div").eq(currentTypedWords.length - 2).children().eq(currentTypedWord.length - 1);
            //     lastShownLetter.addClass("correct");
            // }

            if (!settings.blindMode) {
                if (currentTypedWord.length > 0) {
                    if (lastTypedLetter == lastCorrectLetter && !lastShownLetter.hasClass("correct") && lastShownLetter.html() != " ") {
                        lastShownLetter.addClass("correct");
                        if (e.key == "Enter") {
                            typed.push(" ");
                        }

                    } else if (lastTypedLetter != lastCorrectLetter && !lastShownLetter.hasClass("incorrect")) {
                        lastShownLetter.addClass("incorrect");
                    }
                }


                // --------------------------------------------------------------------

                if (currentTypedWords.length >= 2) {
                    let lastTypedWord = currentTypedWords[currentTypedWords.length - 2]
                    let correctLastWord = text[currentTypedWords.length - 2]
                    let lastShownWord = $("#words").find("div").eq(currentTypedWords.length - 2)

                    if (lastTypedWord != correctLastWord) {
                        lastShownWord.addClass("error");
                    }
                }
            } else {
                if (currentTypedWord.length > 0) {
                    lastShownLetter.addClass("correct");
                }
                if (currentTypedWords.length >= 2) {
                    let lastShownWord = $("#words").find("div").eq(currentTypedWords.length - 2)

                    for (let letter of lastShownWord.children()) {
                        $(letter).addClass("correct");
                    }
                }
            }


            // I decided that overtyping was probably bad considering the page lengths are fixed. maybe do something here later
            // ------------------- Overtyping ---------------------------
            let typedWord = currentTypedWords[currentTypedWords.length - 1];

            let correctWord = text[currentTypedWords.length - 1];
            // let currentShownWord = getWordsOnScreen().split(" ")[currentTypedWords.length - 1];

            // if (typedWord.length > correctWord.length && typedWord.length > currentShownWord.length) {
            //     let letter = (e.key == "Enter") ? "_" : typedWord.substring(typedWord.length - 1);
            //     let currentEndLetter = $("#words").find("div").eq(currentTypedWords.length - 1).children().eq(typedWord.split("").length - 2);

            //     $(`<letter class="incorrect">${letter}</letter>`).insertAfter(currentEndLetter);
            // }
            // ---------------------------------------------------------------

            if (currentTypedWords.length == text.length && typedWord == correctWord) {
                nextWordSet();
            }

            // windowResize();
            updateCaret();

        }
        if (e.key == " ") {
            e.preventDefault();
        }
    }
}

// Runs on keydown, used for removing letters
function checkKey(e) {
    function removeLetter() {
        // ------------------------- Removes letter styling -----------------------------------
        let currentTypedWords = getTypedAsWords();
        let currentTypedWordsLength = currentTypedWords.length - 1;
        let currentTypedWord = currentTypedWords[currentTypedWordsLength].split("");
        let lastShownLetter = $("#words").find("div").eq(currentTypedWordsLength).children().eq(currentTypedWord.length - 1);

        // Removes nlChar styling 
        if (currentTypedWord.length == 0 && typed[typed.length - 1] == "\n") {
            currentTypedWordsLength = currentTypedWords.length - 2;
            currentTypedWord = currentTypedWords[currentTypedWordsLength].split("");
            lastShownLetter = $("#words").find("div").eq(currentTypedWordsLength).children().eq(currentTypedWord.length);

        }

        lastShownLetter.removeClass("correct");
        lastShownLetter.removeClass("incorrect");

        // ---------------------------------------------------------------------------------------


        typed.pop();

        currentTypedWords = getTypedAsWords();

        let currentWordElement = $("#words").find("div").eq(currentTypedWords.length - 1);
        if (currentWordElement.hasClass("error")) {
            currentWordElement.removeClass("error");
        }


        // removed overtyping for now.
        // -------------------  Overtyping ----------------------------
        // currentTypedWords = getTypedAsWords();
        // let lastTypedWord = currentTypedWords[currentTypedWords.length - 1];

        // let correctWord = text[currentTypedWords.length - 1];
        // let currentShownWord = getWordsOnScreen().split(" ")[currentTypedWords.length - 1];

        // if (lastTypedWord.length >= correctWord.length && lastTypedWord.length < currentShownWord.length) {
        //     let currentEndLetter = $("#words").find("div").eq(currentTypedWords.length - 1).children().eq(currentShownWord.length - 1);

        //     currentEndLetter.remove();
        // }
        // -------------------------------------------------------------
    }
    if (text.length > 0) {
        if (!$("#words").hasClass("hidden") && typed.length != 0) {

            if (e.key == "Backspace") {
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

class WrongSpace {}

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