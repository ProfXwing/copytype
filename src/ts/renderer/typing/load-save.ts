import { TypingHistory } from "../model/typingHistoryModel.js";
import { BookStats } from "../model/bookStatsModel.js";
import { MetaDataModel } from "../model/metaDataModel.js";
import { stopTimer } from "../timer.js";
import { getWordsTyped, setTyped } from "./test.js";
import { changeDivisionText, currentPage, nextWordSet, setCurrentPage } from "./display.js";
import { getSettings, newSettings } from "../settings.js";
import { tryRestartBook } from "../dialogs.js";
import { switchContent } from "../window.js";
import { getCorrectChars } from "../stats.js";
import { saveTypingHistory } from "../text-gen.js";
import { removePunctuation } from "../misc.js";

export var currentBookStats: BookStats;
export var currentBookData: MetaDataModel;

export var fullText: string[];
export function setFullText(newText) {
  fullText = newText;
}

export var typingHistory: TypingHistory = [];
export var savedTypingHistory = [];
// export var savedTypingHistory = window.electron.getTypingHistory();

var settings = getSettings();

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

  setTyped([]);
  fullText = undefined;
}

// Initializes typing screen
export function initTyping(book?: string, words?: string[]) {
  // Current page may be undefined at this point
  if (!currentPage) setCurrentPage(0);
  settings = newSettings();

  // Restart book if it was finished
  if (book) {
    if (window.electron.getBookStats(book).finishedBook) {
      $("#restart-book").ready(() => {
        tryRestartBook(book);
        return;
      })
    }
  }

  // saves in case another book is loaded
  saveTyping();

  if (book) {
    // Load book stats and data
    currentBookStats = window.electron.getBookStats(book);
    currentBookData = window.electron.getBookData(book);

    // Set current book
    settings.currentBook = book;
    window.electron.saveSettings(settings);

    currentBookStats.sessions++;

    // Show chapter label
    if (!currentBookStats.startedBook && settings.showPageLabel != 'off') {
      $("#chapter-label").removeClass("hide-chapter-label");
    }

    $("#page-selectors").removeClass('hidden');

    // Sets page/chap/division label
    changeDivisionText();
    loadTextForTest();

  } else if (words) {
    currentBookStats = new BookStats();
    currentBookData = {} as MetaDataModel;

    loadTextForTest(words);
  }

  // Resets array of typed chars
  setTyped([]);

  // Sets up the text
  nextWordSet(true);
  switchContent("#typing");
}

export function saveAndReload() {
  saveTyping();
  currentBookStats = window.electron.getBookStats(settings.currentBook);
  currentBookData = window.electron.getBookData(settings.currentBook);
  changeDivisionText();
  setTyped([]);
  loadTextForTest();
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

export function saveTyping(stopping = true) {
  if (currentBookStats) {
    if (stopping) { stopTimer(); }
    const savedBookStats = structuredClone(currentBookStats);

    // Bookmark
    savedBookStats.typedPos = currentBookStats.typedPos + getWordsTyped().length - 1;

    savedBookStats.wpm.correctChars = currentBookStats.wpm.correctChars + getCorrectChars();

    // savedTypingHistory = savedTypingHistory.concat(typingHistory);
    // typingHistory = saveTypingHistory(savedTypingHistory, savedBookStats.bookName);

    window.electron.saveBookStats(savedBookStats);
  }
}

export function replaceAccents(word: string) {
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

export function loadTextForTest(words?: string[]) {
  if (words) {
    setFullText(words);
  } else {
    setFullText(window.electron.getDataFromJSON(currentBookData.textPath[currentBookStats.chapter]));
  }

  for (const toReplace of settings.removeFromText) {
    setFullText(fullText.join(" ").replaceAll(toReplace, "").split(" "));
  }

  if (settings.removePunctuation) {
    setFullText(removePunctuation(fullText.join(" ")).split(" "));
  }

  if (settings.removeCaps) {
    setFullText(fullText.map(word => {
      return word.toLowerCase();
    }));
  }

  if (settings.removeNewLine) {
    setFullText(fullText.join(" ").replaceAll("\n ", " ").split(" "));
  }
}

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