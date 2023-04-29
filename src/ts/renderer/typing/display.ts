import { showDialog } from "../dialogs.js";
import { settings } from "../settings.js";
import { getCorrectChars } from "../stats.js";
import { stopTimer } from "../timer.js";
import { getWordsTyped, setText, setTyped, text, typed, WrongSpace } from "./test.js";
import { currentBookData, currentBookStats, fullText, loadTextForTest, replaceAccents, saveTyping } from "./load-save.js"
export var currentPage = 0;

export function setCurrentPage(newPage: number) {
  currentPage = newPage;
}

var pageLengths: {
  [key: number]: {
    chapter: number,
    startPos: number,
    endPos: number,
  }
} = {};


var caretPosX: number;
var caretPosY: number;

var showChapterEvent: NodeJS.Timeout;

// Caret is moved on window resize
$(window).resize(function () {
  if (currentBookStats) {
    nextWordSet(true);
  }
  if (!$("#words").hasClass("hidden")) {
    updateCaret();
  }
});

// Updates the caret position 
export function updateCaret(init = false) {
  // Handle caret animation
  if (typed.length == 0 && !$('#caret').hasClass('animate-caret')) {
    $('#caret').addClass("animate-caret");
  } else if (typed.length > 0 && $('#caret').hasClass('animate-caret')) {
    $('#caret').removeClass("animate-caret");
  }

  if ($("#words").find(".word").length) {

    const typedWords = getWordsTyped();

    // Get the index of the current word
    let currentWordIndex;
    if (typedWords.length > 0) {
      currentWordIndex = typedWords.length - 1;
    } else {
      currentWordIndex = 0;
    }

    const currentWord = typedWords[typedWords.length - 1].split("");

    // Get the index of the current letter
    let currentCharIndex;
    if (currentWord.length > 0) {
      currentCharIndex = currentWord.length - 1;
    } else {
      currentCharIndex = 0;
    }

    // List of letters in the current typed word
    const lettersList = $("#words").find(".word").eq(currentWordIndex).children();
    let lastLetter: JQuery<HTMLElement>;

    // If the current word is longer than the displayed word, get the last letter of the displayed word
    if (currentWord.length > lettersList.length) {
      lastLetter = lettersList.eq(lettersList.length - 1);

      // Otherwise, get the current letter 
    } else {
      lastLetter = lettersList.eq(currentCharIndex);
    }

    let charPosition = lastLetter.position();
    let width = lastLetter.width()

    const caret = $("#caret");

    // Calculate the caret position
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

    // Move the caret (animate if needed)
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

// Poorly named, displays "Page 1" etc
export function changeDivisionText() {
  if (currentBookData.division != "") {
    $("#chapter-label").text(`${currentBookData.division} ${currentBookStats.chapter + 1}`);
  }
}

export function prevChapter() {
  if (currentBookStats.chapter > 0) {
    currentBookStats.typedPos = 0;
    currentBookStats.chapter--;
    changeDivisionText();
    loadTextForTest();
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
    loadTextForTest();
    nextWordSet(true);
  }
}

function prevWordSet() {
  setTyped([]);
  currentPage--;
  // Previous chapter if at the beginning of the chapter
  if (currentBookStats.typedPos == 0) {
    if (currentBookStats.chapter > 0) {
      currentBookStats.chapter--;
    } else {
      currentPage++;
    }
    showChapterLabel();
    loadTextForTest();
    currentBookStats.typedPos = fullText.length;
  }

  // Page already loaded
  if (Object.keys(pageLengths).includes(currentPage.toString())) {
    if (currentBookStats.chapter != pageLengths[currentPage].chapter) {
      currentBookStats.chapter = pageLengths[currentPage].chapter;
      showChapterLabel();
      loadTextForTest();
    }

    currentBookStats.typedPos = pageLengths[currentPage].startPos;
    setText(fullText.slice(pageLengths[currentPage].startPos));
    text.splice(pageLengths[currentPage].endPos - pageLengths[currentPage].startPos);
    // Load new page
  } else {
    const startPos = currentBookStats.typedPos;
    currentBookStats.typedPos -= settings.wordCount;
    if (currentBookStats.typedPos < 0) currentBookStats.typedPos = 0;
    setText(fullText.slice(currentBookStats.typedPos));
    text.splice(startPos - currentBookStats.typedPos);
  }

  // Replace accents in lazy mode
  if (settings.lazyMode) {
    const new_text = [];
    for (const word of text) {
      new_text.push(replaceAccents(word));
    }
    setText(new_text);
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

export function scrollWords() {

  console.log("scrolling");
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
    setTyped([]);
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
      loadTextForTest();
    }
  }

  // Page already loaded
  if (Object.keys(pageLengths).includes(currentPage.toString())) {
    if (currentBookStats.chapter != pageLengths[currentPage].chapter) {
      currentBookStats.chapter = pageLengths[currentPage].chapter;
      showChapterLabel();
      loadTextForTest();
    }

    currentBookStats.typedPos = pageLengths[currentPage].startPos;
    setText(fullText.slice(pageLengths[currentPage].startPos));
    text.splice(pageLengths[currentPage].endPos - pageLengths[currentPage].startPos);

    // Load page
  } else {
    setText(fullText.slice(currentBookStats.typedPos))
    text.splice(settings.wordCount);
  }

  // Replace accents in lazy mode
  if (settings.lazyMode) {
    const new_text = [];
    for (const word of text) {
      new_text.push(replaceAccents(word));
    }
    setText(new_text);
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
  if (keepCurrent && typed.length > 0) {
    const currentTyped = getWordsTyped();
    for (let wordIndex = 0; wordIndex < currentTyped.length; wordIndex++) {
      const letterCount = currentTyped[wordIndex].length - 1;

      for (let letterIndex = 0; letterIndex <= letterCount; letterIndex++) {
        styleWord(wordIndex, letterIndex, true);
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

    const wordsTyped = getWordsTyped();
    if (wordsTyped.length >= text.length) {
      nextWordSet();
    }

    // Save current page
    if (!Object.keys(pageLengths).includes(currentPage.toString())) {
      setPageLengths();
    }

    updateCaret(true);
    showWords();
  });
}

export function removeWordsOffScreen() {
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

export function setPageLengths() {
  pageLengths[currentPage] = {
    startPos: currentBookStats.typedPos,
    endPos: currentBookStats.typedPos + text.length,
    chapter: currentBookStats.chapter
  }
}

export function styleWord(wordIndex = getWordsTyped().length - 1, letterIndex: number = undefined, addExtraLetters = false) {
  if (typed.length == 0) return;

  const typedWords = getWordsTyped();
  const typedWord = typedWords[wordIndex].split("");

  if (letterIndex == undefined) {
    letterIndex = typedWord.length - 1;
  }

  const typedLetter: WrongSpace | string = typedWords[wordIndex][letterIndex];

  const shownWord = $("#words").find("div").eq(wordIndex);
  const shownLetter = shownWord.children().eq(letterIndex);
  const lastShownWord = $("#words").find("div").eq(wordIndex - 1)

  const correctWord = text[wordIndex];
  const correctWordPart = correctWord.slice(0, typedWord.length);

  const correctLetter = correctWord[letterIndex];

  const newLetter = typedLetter instanceof WrongSpace ? "_" : typedLetter;

  if (settings.highlightMode == "letter") {
    if (!settings.blindMode) {

      if (typedWord.length > 0) {
        if (typedLetter == correctLetter && !shownLetter.hasClass("correct") && shownLetter.html() != " ") {
          shownLetter.addClass("correct");
        } else if (typedLetter != correctLetter && !shownLetter.hasClass("incorrect")) {
          shownLetter.addClass("incorrect");
          if (settings.indicateTypos == "below") {
            const hint = document.createElement("hint");
            hint.innerHTML = newLetter;
            shownLetter.append(hint);
          } else if (settings.indicateTypos == "replace") {
            shownLetter.text(newLetter);
          }

          if (letterIndex > correctWord.length - 1 && addExtraLetters) {
            const letterElem = document.createElement("letter");
            letterElem.setAttribute('char', newLetter);
            letterElem.classList.add('incorrect', 'extra')
            letterElem.innerHTML = newLetter;

            const prevLetter = $("#words").find("div").eq(wordIndex).children().eq(letterIndex - 1);

            $(letterElem).insertAfter(prevLetter);
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
            hint.innerHTML = newLetter;
            shownLetter.append(hint);
          } else if (settings.indicateTypos == "replace") {
            shownLetter.text(newLetter);
          }
        }
      }

      checkError(wordIndex - 1);
    }
  }
}

function checkError(index: number) {
  const currentTypedWords = getWordsTyped();
  const lastTypedWord = currentTypedWords[index]
  const correctLastWord = text[index]
  const lastShownWord = $("#words").find("div").eq(index)

  if (lastTypedWord != correctLastWord) {
    lastShownWord.addClass("error");
  }
}

