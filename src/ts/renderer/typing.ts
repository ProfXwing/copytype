// TODO: make this file smaller
// what even are objects 🟡 

import { BookStats } from "./model/bookStatsModel.js";
import { MetaDataModel } from "./model/metaDataModel.js";
import { KeyPress, TypingHistory } from "./model/typingHistoryModel.js";
import {
  showDialog, tryRestartBook
} from "./dialogs.js";
import { findSlowestWords, saveTypingHistory, sortKeysByTime } from "./text-gen.js";
import {
  startTimer,
  stopTimer,
  updateStats,
  timerStarted,
  resetLastPressed,
} from "./timer.js";

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

class WrongSpace { }


export var currentBookStats: BookStats;
var currentBookData: MetaDataModel;

var fullText: string[];
var text: string[] = [];
var typed: Partial<[string | WrongSpace]> = [];

var typingHistory: TypingHistory = [];
export var savedTypingHistory = window.electron.getTypingHistory();

var currentPage = 0;
var pageLengths: {
  [key: number]: {
    chapter: number,
    startPos: number,
    endPos: number,
  }
} = {
  /* pageNum: {
      chapter,
      startPos,
      endPos
  } */
};

export var settings = window.electron.getSettings();

var caretPosX;
var caretPosY;


export var stopTimerEvent = setTimeout(() => {
  stopTimer(5000);
  saveTyping(false);
}, 5000);

setInterval(() => {
  updateStats()
}, 500);

var showChapterEvent: NodeJS.Timeout;

var libraryLoaded = false;

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

  if (settings.currentBook) {
    switchContent("#typing");
    nextWordSet(true);
  } else {
    switchContent("#library");
  }
}

// Page switcher
export function switchContent(div: string) {
  for (const child of $("#middle").children()) {
    $(child).addClass("hidden");
  }

  $("#no-book-warning").addClass("hidden");

  $(div).removeClass("hidden");

  if (div == "#library" && !libraryLoaded) {
    libraryLoaded = true;
    window.electron.loadLibrary();
  }
}

export function loadLibrary() {
  libraryLoaded = false;
}

function getShownWordText(index: number) {
  let shownWord = "";
  for (const letter of $("#words").find(".word").eq(index).children()) {
    shownWord += letter.getAttribute('char');
  }
  return shownWord;
  // $("#words").find(".word").eq(currentTypedWords.length - 1).text()
}

export function getCorrectChars() {
  let correctChars = 0;
  for (const word in getTypedAsWords()) {
    const typedWord = getTypedAsWords()[word];
    if (typedWord == text[word] || settings.blindMode) {
      correctChars += typedWord.length;
    }

    // if there's a space after the word (word isn't last word)
    if (parseInt(word + 1) <= typed.length - 1)
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
    const typedWords = getTypedAsWords();
    const currentWord = typedWords[typedWords.length - 1].split("");
    let typedWordsLength = typedWords.length - 1;
    let currentWordLength = currentWord.length - 1;

    if (typedWords.length == 0) {
      typedWordsLength = 0;
    }
    if (currentWord.length == 0) {
      currentWordLength = 0;
    }

    const lettersList = $("#words").find(".word").eq(typedWordsLength).children();
    let lastLetter;
    if (currentWord.length > lettersList.length) {
      lastLetter = lettersList.eq(lettersList.length - 1);
    } else {
      lastLetter = lettersList.eq(currentWordLength);
    }

    let charPosition = lastLetter.position();
    let width = lastLetter.width()

    const caret = $("#caret");

    if (typed.length == 0) {
      width = 0;
      charPosition = $("#words").find("div").eq(0).children().eq(0).position();
    }
    const caretWidth = caret[0].getBoundingClientRect().width / 2;
    if (settings.caretStyle == "default") {
      caretPosX = (currentWord.length == 0) ? charPosition.left - caretWidth : charPosition.left + width - caretWidth;
    } else {
      caretPosX = (currentWord.length == 0) ? charPosition.left : charPosition.left + width;
    }

    caretPosY = charPosition.top;

    if (init) {
      caret.stop(true, true);
      caret.css("left", caretPosX);
      caret.css("top", caretPosY);
    } else {
      const duration = (settings.smoothCaret) ? 100 : 0;

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
  $("#chap-prev").addClass('hidden');
  $("#chap-next").addClass('hidden');
  $("#page-prev").addClass('hidden');
  $("#page-next").addClass('hidden');
  $("#pause-menu").addClass('hidden');
  $("#chapter-label").addClass("hide-chapter-label")
  $("#words").empty();

  currentBookStats = undefined;
  currentBookData = undefined;

  typed = [];
  fullText = undefined;
}

// Initializes typing screen
export function initTyping(book: string) {
  settings = window.electron.getSettings();
  if (window.electron.getBookStats(book).finishedBook) {
    $("#restart-book").ready(() => {
      tryRestartBook(book);
    })
  } else {
    // saves in case another book is loaded
    saveTyping();

    currentBookStats = window.electron.getBookStats(book);
    currentBookData = window.electron.getBookData(book);

    settings.currentBook = book;
    window.electron.saveSettings(settings);

    $("#page-selectors").removeClass('hidden');

    if (!currentBookStats.startedBook && settings.showPageLabel != 'off') {
      $("#chapter-label").removeClass("hide-chapter-label");
    }
    changeDivisionText();

    typed = []
    readyFullText();
    currentBookStats.sessions++;

    nextWordSet(true);
    switchContent("#typing");
  }
}

export function saveAndReload() {
  saveTyping();
  currentBookStats = window.electron.getBookStats(settings.currentBook);
  currentBookData = window.electron.getBookData(settings.currentBook);
  changeDivisionText();
  typed = []
  readyFullText();
  nextWordSet(true);
}

export function continueTyping() {
  switchContent("#typing");
  if (!currentBookStats) {
    $("#no-book-warning").removeClass("hidden");
  } else {
    nextWordSet(true);
  }
}

export async function saveTyping(stopping = true) {
  if (currentBookStats) {
    if (stopping) { stopTimer(); }
    const savedBookStats = structuredClone(currentBookStats);

    // Bookmark
    savedBookStats.typedPos = currentBookStats.typedPos + getTypedAsWords().length - 1;

    savedBookStats.wpm.correctChars = currentBookStats.wpm.correctChars + getCorrectChars();

    savedTypingHistory = savedTypingHistory.concat(typingHistory);
    typingHistory = saveTypingHistory(savedTypingHistory);

    console.log(findSlowestWords());

    await window.electron.saveBookStats(savedBookStats);
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

  if (settings.showPageLabel == 'on') {
    $("#chapter-label").removeClass("hide-chapter-label");
    clearTimeout(showChapterEvent);
    showChapterEvent = setTimeout(() => {
      $("#chapter-label").addClass("hide-chapter-label")
    }, 2000)
  }
}

function changeDivisionText() {
  if (currentBookData.division != "") {
    $("#chapter-label").text(`${currentBookData.division} ${currentBookStats.chapter + 1}`);
  }
}

export function prevChapter() {
  if (currentBookStats.chapter > 0) {
    currentBookStats.typedPos = 0;
    currentBookStats.chapter--;
    changeDivisionText();
    readyFullText();
    nextWordSet(true);
  }
}

export function prevPage() {
  prevWordSet();
}

export function nextPage() {
  nextWordSet();
}

export function nextChapter() {
  if (currentBookStats.chapter < currentBookData.textPath.length - 1) {
    currentBookStats.typedPos = 0;
    currentBookStats.chapter++;
    changeDivisionText();
    readyFullText();
    nextWordSet(true);
  }
}

function prevWordSet() {
  typed = [];
  currentPage--;
  // Previous chapter if at the beginning of the chapter
  if (currentBookStats.typedPos == 0) {
    if (currentBookStats.chapter > 0) {
      currentBookStats.chapter--;
    } else {
      currentPage++;
    }
    showChapterLabel();
    readyFullText();
    currentBookStats.typedPos = fullText.length;
  }

  // Page already loaded
  if (Object.keys(pageLengths).includes(currentPage.toString())) {
    if (currentBookStats.chapter != pageLengths[currentPage].chapter) {
      currentBookStats.chapter = pageLengths[currentPage].chapter;
      showChapterLabel();
      readyFullText();
    }

    currentBookStats.typedPos = pageLengths[currentPage].startPos;
    text = fullText.slice(pageLengths[currentPage].startPos);
    text.splice(pageLengths[currentPage].endPos - pageLengths[currentPage].startPos);
    // Load new page
  } else {
    const startPos = currentBookStats.typedPos;
    currentBookStats.typedPos -= settings.wordCount;
    if (currentBookStats.typedPos < 0) currentBookStats.typedPos = 0;
    text = fullText.slice(currentBookStats.typedPos);
    text.splice(startPos - currentBookStats.typedPos);
  }

  // Replace accents in lazy mode
  if (settings.lazyMode) {
    const new_text = [];
    for (const word of text) {
      new_text.push(replaceAccents(word));
    }
    text = new_text;
  }

  stopTimer();
  saveTyping(false);

  // Add words to screen
  hideWords();
  $("#words").empty();
  for (const word of text) {
    $("#words").append(`<div class="word"></div>`);
    const children = $("#words").children();
    const currentWord = children[children.length - 1];

    for (const char of word) {
      const letterElem = document.createElement("letter");
      letterElem.setAttribute('char', char);

      if (char == "\n") {
        letterElem.classList.add("nlChar");
        letterElem.innerHTML = `<i class="fas fa-angle-down"></i>`
        $(currentWord).append(letterElem);
        $("#words").append("<br>");
      } else {
        letterElem.innerHTML = char;
      }
      $(currentWord).append(letterElem);
    }
  }

  $("#words").append("<div id='caret'></div>");

  // Load page
  $("#caret").ready(function () {
    // Remove the words that aren't on the screen 
    while ($("#words .word:last").position().top > $(window).height() - 160) {
      $("#words .word").first().remove();
      text.shift();
      if ($("#words").children().first().prop("nodeName") == "BR") {
        $("#words").children().first().remove();
      }
      currentBookStats.typedPos++;
    }

    // Save current page
    if (!Object.keys(pageLengths).includes(currentPage.toString())) {
      setPageLengths();
    }

    updateCaret(true);
    showWords();
  });
}


export function nextWordSet(keepCurrent = false) {
  if (currentBookStats.finishedBook) { return; }

  $("#words").toggleClass("flipped", settings.flipTestColors);
  $("#words").toggleClass("colorfulMode", settings.colorfulMode);
  $("#wpm-counter").toggleClass("hidden", !settings.showLiveWpm);
  $("#acc-counter").toggleClass("hidden", !settings.showLiveAcc);
  $("#page-prev").toggleClass("hidden", !settings.pageNavigation);
  $("#page-next").toggleClass("hidden", !settings.pageNavigation);
  $("#chap-prev").toggleClass("hidden", !settings.chapterNavigation);
  $("#chap-next").toggleClass("hidden", !settings.chapterNavigation);
  $("#pause-menu").toggleClass("hidden", !settings.pausePlayButton);
  $(":root").css("--font-size", settings.fontSize + "rem");
  if (settings.showPageLabel == "always on") {
    $("#chapter-label").removeClass("hide-chapter-label");
  }

  if (settings.pageNavigation && !settings.chapterNavigation) {
    $("#page-prev").css("margin-right", "30px")
  } else {
    $("#page-prev").css("margin-right", "10px")
  }
  if (settings.chapterNavigation && !settings.pageNavigation) {
    $("#chap-prev").css("margin-right", "0")
  } else {
    $("#chap-prev").css("margin-right", "30px")
  }

  if (!keepCurrent) {
    currentPage++;
    currentBookStats.wpm.correctChars += getCorrectChars();
    currentBookStats.typedPos += text.length;
    typed = [];
  } else pageLengths = {};

  // Chapter finished
  if (currentBookStats.typedPos >= fullText.length - 1) {

    // Finish Book
    if (currentBookStats.chapter == currentBookData.textPath.length - 1) {
      $("#book-finished").ready(() => {
        currentBookStats.finishedBook = true;
        saveTyping();
        delete settings.currentBook;
        window.electron.saveSettings(settings);
        showDialog('book-finished');

      })
      return;

      // Next Chapter
    } else {
      currentBookStats.chapter++;
      showChapterLabel();
      currentBookStats.typedPos = 0;
      readyFullText();
    }
  }

  // Page already loaded
  if (Object.keys(pageLengths).includes(currentPage.toString())) {
    if (currentBookStats.chapter != pageLengths[currentPage].chapter) {
      currentBookStats.chapter = pageLengths[currentPage].chapter;
      showChapterLabel();
      readyFullText();
    }

    currentBookStats.typedPos = pageLengths[currentPage].startPos;
    text = fullText.slice(pageLengths[currentPage].startPos);
    text.splice(pageLengths[currentPage].endPos - pageLengths[currentPage].startPos);

    // Load page
  } else {
    text = fullText.slice(currentBookStats.typedPos)
    text.splice(settings.wordCount);
  }

  // Replace accents in lazy mode
  if (settings.lazyMode) {
    const new_text = [];
    for (const word of text) {
      new_text.push(replaceAccents(word));
    }
    text = new_text;
  }

  stopTimer();
  if (!keepCurrent) {
    saveTyping(false);
  }

  // Add words to screen
  hideWords();
  $("#words").empty();
  for (const word of text) {
    $("#words").append(`<div class="word"></div>`);
    const children = $("#words").children();
    const currentWord = children[children.length - 1];

    for (const char of word) {
      const letterElem = document.createElement("letter");
      letterElem.setAttribute('char', char);


      if (char == "\n") {
        letterElem.classList.add("nlChar");
        letterElem.innerHTML = `<i class="fas fa-angle-down"></i>`
        $(currentWord).append(letterElem);
        $("#words").append("<br>");
      } else {
        letterElem.innerHTML = char;
      }
      $(currentWord).append(letterElem);
    }
  }

  // Styles words that are already typed
  if (keepCurrent) {
    const currentTyped = getTypedAsWords();
    for (let wordIndex = 0; wordIndex < currentTyped.length; wordIndex++) {
      const letterCount = currentTyped[wordIndex].length - 1;

      for (let letterIndex = 0; letterIndex <= letterCount; letterIndex++) {
        styleWord(wordIndex, letterIndex);
      }

      if (letterCount == -1) {
        styleWord(wordIndex, 0);
      }
    }
  }

  $("#words").append(`<div id='caret' class='${settings.caretStyle}'></div>`);

  // Once the list of 100 words has loaded, remove the words that aren't on the screen 
  $("#caret").ready(function () {
    removeWordsOffScreen();

    // Save current page
    if (!Object.keys(pageLengths).includes(currentPage.toString())) {
      setPageLengths();
    }

    updateCaret(true);
    showWords();
  });
}

function removeWordsOffScreen() {
  for (const child of $("#words").find("div").toArray().reverse()) {
    if ($(child).position().top > $(window).height() - 160 && $(child).attr('id') != "caret") {
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
function canType(key: string) {
  const currentTypedWords = getTypedAsWords();

  if ((key == " " || key == "Enter") && currentTypedWords.length + 1 > text.length) {
    currentBookStats.accuracy.typedChars++;
    currentBookStats.accuracy.correctChars++;
    currentBookStats.wpm.correctChars++;
    const ms = resetLastPressed();
    typingHistory.push([ms, key]);
    nextWordSet();
    updateCaret();
    return false;
  }

  const typedWord = currentTypedWords[currentTypedWords.length - 1];
  const correctWord = text[currentTypedWords.length - 1];

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
  const typedWords = getTypedAsWords();
  const typedWord = typedWords[typedWords.length - 1];
  const typedLetter = typedWord[typedWord.length - 1];

  const correctWord = text[typedWords.length - 1];
  const correctLetter = correctWord[typedWord.length - 1];

  currentBookStats.accuracy.typedChars++;
  // this counts space as correct because they are both undefined in this case. probably bad to rely on that.
  if (typedLetter == correctLetter) {
    currentBookStats.accuracy.correctChars++;

    // typedLetter was space
    if (typedWord == "") {
      // length was incorrect, spaced incorrectly
      if (typedWords[typedWords.length - 2].length != text[typedWords.length - 2].length) {
        return false
      }
    }

    return true;
  }
  return false;
}

function styleWord(wordIndex = getTypedAsWords().length - 1, letterIndex: number = undefined) {
  const typedWords = getTypedAsWords();
  const typedWord = typedWords[wordIndex].split("");

  if (letterIndex == undefined) {
    letterIndex = typedWord.length - 1;
  }

  const typedLetter = typedWords[wordIndex][letterIndex];

  const shownWord = $("#words").find("div").eq(wordIndex);
  const shownLetter = shownWord.children().eq(letterIndex);
  const lastShownWord = $("#words").find("div").eq(wordIndex - 1)

  const correctWord = text[wordIndex];
  const correctWordPart = correctWord.slice(0, typedWord.length);

  const correctLetter = correctWord[letterIndex];

  if (settings.highlightMode == "letter") {
    if (!settings.blindMode) {

      if (typedWord.length > 0) {
        if (typedLetter == correctLetter && !shownLetter.hasClass("correct") && shownLetter.html() != " ") {
          shownLetter.addClass("correct");
        } else if (typedLetter != correctLetter && !shownLetter.hasClass("incorrect")) {
          shownLetter.addClass("incorrect");
          if (settings.indicateTypos == "below") {
            const hint = document.createElement("hint");
            hint.innerHTML = typedLetter;
            shownLetter.append(hint);
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
        for (const letter of lastShownWord.children()) {
          $(letter).addClass("correct");
        }
      }
    }
  } else if (settings.highlightMode == "word") {
    for (const word of $("#words").find(".word")) {
      if (word != shownWord as unknown as HTMLElement) {
        for (const letter of $(word).find('letter')) {
          $(letter).removeClass("correct");
        }
      }
    }

    if (typedWord.join("") != correctWordPart && !settings.blindMode) {
      for (const letter of shownWord.find("letter")) {
        $(letter).removeClass("correct").addClass("incorrect");
      }
    } else {
      for (const letter of shownWord.find("letter")) {
        $(letter).removeClass("incorrect").addClass("correct");
      }
    }

    if (!settings.blindMode) {
      if (typedWord.length > 0) {

        if (typedLetter != correctLetter) {
          if (settings.indicateTypos == "below") {
            const hint = document.createElement("hint");
            hint.innerHTML = typedLetter;
            shownLetter.append(hint);
          } else if (settings.indicateTypos == "replace") {
            const newLetter = typedLetter;
            // if (typedLetter instanceof WrongSpace) {
            //   newLetter = "_";
            // }
            shownLetter.text(newLetter);
            // lastShownLetter.removeClass("nlChar");
          }
        }
      }

      checkError(wordIndex - 1);
    }
  }
}

// Runs on keypress, adds key to typed list and styles screen appropriately
function typeKey(e: KeyboardEvent) {
  if (text.length > 0 && !$("#typing").hasClass("hidden")) {
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
      const keyIsCorrect = checkCorrect();

      let currentTypedWords = getTypedAsWords();


      // ---------------------- Letter styling (correct or wrong) ---------------------------
      const lastShownLetters = $("#words").find("div").eq(currentTypedWords.length - 1).children();

      if (['rgb', 'aurora', 'fire', 'trance'].includes(settings.currentTheme)) {
        for (const letter of lastShownLetters) {
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
        if (settings.showPageLabel == "on") {
          $("#chapter-label").addClass("hide-chapter-label");
        }
      }

      if (!timerStarted) {
        startTimer();
      }

      const ms = resetLastPressed();

      let key = e.key;
      if (key == "Enter") {
        key = "\n";
      }
      const keyPress: KeyPress = [ms, key];
      if (keyIsCorrect == false) {
        keyPress.push(1);
      }
      typingHistory.push(keyPress);
      console.log(typingHistory[typingHistory.length - 1]);

      // probably shouldn't do this, but i'm gonna do it anyway 😈
      clearTimeout(stopTimerEvent);
      stopTimerEvent = setTimeout(() => {
        stopTimer(5000);
        saveTyping(false);
      }, 5000);


      // ------------------- Overtyping ---------------------------
      if (!settings.hideExtraLetters && !settings.blindMode) {
        typedWord = currentTypedWords[currentTypedWords.length - 1];

        correctWord = text[currentTypedWords.length - 1];
        const currentShownWord = getShownWordText(currentTypedWords.length - 1);

        if (typedWord.length > correctWord.length && typedWord.length > currentShownWord.length) {
          let letter = (e.key == "Enter") ? "_" : typedWord.substring(typedWord.length - 1);
          const currentEndLetter = $("#words").find("div").eq(currentTypedWords.length - 1).children().eq(typedWord.split("").length - 2);

          if (typed[typed.length - 1] instanceof WrongSpace) {
            letter = "_";
          }

          const letterElem = document.createElement("letter");
          letterElem.setAttribute('char', letter);
          letterElem.classList.add('incorrect', 'extra')
          letterElem.innerHTML = letter;

          $(letterElem).insertAfter(currentEndLetter);

          removeWordsOffScreen();
          setPageLengths();
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

function checkError(index: number) {
  const currentTypedWords = getTypedAsWords();
  const lastTypedWord = currentTypedWords[index]
  const correctLastWord = text[index]
  const lastShownWord = $("#words").find("div").eq(index)

  if (lastTypedWord != correctLastWord) {
    lastShownWord.addClass("error");
  }
}

// Runs on keydown, used for removing letters
function checkKey(e: KeyboardEvent) {
  function removeLetter() {
    // ------------------------- Removes letter styling -----------------------------------
    let currentTypedWords = getTypedAsWords();
    let currentTypedWordsLength = currentTypedWords.length - 1;
    let currentTypedWord = currentTypedWords[currentTypedWordsLength].split("");
    const correctLetter = text[currentTypedWordsLength][currentTypedWord.length - 1];
    const lastShownWord = $("#words").find("div").eq(currentTypedWordsLength);
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

    // For typing history
    if (!timerStarted) {
      startTimer();
    }

    const ms = resetLastPressed();
    if (typingHistory.length > 0) {
      let delKey = 0;
      let historyDeleting;

      // get the keypress that is being backspaced
      for (let i = typingHistory.length - 1; i >= 0; i--) {
        if (typingHistory[i][1] == "BK") {
          delKey++;
        } else {
          if (delKey == 0) {
            historyDeleting = typingHistory[i];
            break;
          }
          delKey--;
        }
      }

      if (historyDeleting) {
        console.log(historyDeleting);
        const correctBackspace = historyDeleting[2] == 1;
        const keyPress: KeyPress = [ms, "BK"];
        if (correctBackspace == false) {
          keyPress.push(1);
        }
        typingHistory.push(keyPress);
      }
    }

    // probably shouldn't do this, but i'm gonna do it anyway 😈
    clearTimeout(stopTimerEvent);
    stopTimerEvent = setTimeout(() => {
      stopTimer(5000);
      saveTyping(false);
    }, 5000);

    if (settings.highlightMode == "word") {
      styleWord();
    }

    currentTypedWords = getTypedAsWords();
    currentTypedWordsLength = currentTypedWords.length - 1;
    currentTypedWord = currentTypedWords[currentTypedWordsLength].split("");

    if (settings.blindMode) {
      const newShownWord = $("#words").find("div").eq(currentTypedWordsLength);
      const wordChildren = newShownWord.children();
      for (const child of wordChildren.slice(currentTypedWord.length)) {
        $(child).removeClass("correct").removeClass("incorrect");
      }
    }


    const currentWordElement = $("#words").find("div").eq(currentTypedWords.length - 1);
    if (currentWordElement.hasClass("error")) {
      currentWordElement.removeClass("error");
    }


    // -------------------  Overtyping ----------------------------
    currentTypedWords = getTypedAsWords();
    const lastTypedWord = currentTypedWords[currentTypedWords.length - 1];

    const correctWord = text[currentTypedWords.length - 1];
    const currentShownWord = getShownWordText(currentTypedWords.length - 1);

    if (lastTypedWord.length >= correctWord.length && lastTypedWord.length < currentShownWord.length) {
      const currentEndLetter = $("#words").find("div").eq(currentTypedWords.length - 1).children().eq(currentShownWord.length - 1);
      currentEndLetter.remove();
    }
    // -------------------------------------------------------------
  }
  if (text.length > 0 && !$("#typing").hasClass("hidden")) {
    if (!$("#words").hasClass("hidden") && typed.length > 0) {
      const typedAsWords = getTypedAsWords();
      const currentWordLength = typedAsWords[typedAsWords.length - 1].length;
      const lastWord = $("#words").find(".word").eq(typedAsWords.length - 2);

      let hasError = false;
      for (const letter of lastWord.children()) {
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

function getTypedAsWords() {
  const words = [""];
  for (const char of typed) {
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

function replaceAccents(word: string) {
  let newWord = "";
  for (let char of word) {
    // check if char is uppercase
    let upper = false;
    if (char.toUpperCase() == char) {
      upper = true;
    }

    for (const accent of accents) {
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

export function readyFullText() {
  fullText = window.electron.getDataFromJSON(currentBookData.textPath[currentBookStats.chapter]);

  for (const toReplace of settings.removeFromText) {
    fullText = fullText.join(" ").replaceAll(toReplace, "").split(" ");
  }

  const punctuation = [`!`, `?`, `.`, `,`, `:`, `;`, `'`, `"`, "`"];
  if (settings.removePunctuation) {
    for (const punc of punctuation) {
      fullText = fullText.join(" ").replaceAll(punc, "").split(" ");
    }
  }

  if (settings.removeCaps) {
    fullText = fullText.map(word => {
      return word.toLowerCase();
    });
  }

  if (settings.removeNewLine) {
    fullText = fullText.join(" ").replaceAll("\n ", " ").split(" ");
  }
}