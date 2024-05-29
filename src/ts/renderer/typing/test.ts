import { KeyPress } from "../model/typingHistoryModel.js";
import {
  startTimer,
  stopTimer,
  updateStats,
  timerStarted,
  resetLastPressed,
} from "../timer.js";
import { getSettings } from "../settings.js";
import { nextWordSet, removeWordsOffScreen, scrollWords, setPageLengths, styleWord, updateCaret } from "./display.js";
import { currentBookStats, saveTyping, typingHistory } from "./load-save.js";
import { getCharFromEvent } from "../layouts.js";

document.addEventListener('keypress', keyPress);
document.addEventListener('keydown', keyDown);

var settings = getSettings();


export class WrongSpace { }
export var text: string[] = [];
export var typed: Partial<[string | WrongSpace]> = [];

var pageType = "page";


// Stops the typing timer after 5 seconds of inactivity
export var stopTimerEvent = setTimeout(() => {
  stopTimer(5000);
  saveTyping(false);
}, 5000);

// Updates the stats every 500ms
setInterval(() => {
  updateStats()
}, 500);

export function setTyped(newTyped) {
  typed = newTyped;
}

export function setText(newText) {
  text = newText;
}

// Gets the displayed word at an index
function getWordShownAtIndex(index: number) {
  let shownWord = "";
  for (const letter of $("#words").find(".word").eq(index).children()) {
    shownWord += letter.getAttribute('char');
  }
  return shownWord;
}

// Checks if you can type
function canType(key: string) {
  const currentTypedWords = getWordsTyped();
  
  if ((key == " " || key == "Enter") && currentTypedWords.length + 1 > text.length) {
    currentBookStats.accuracy.typedChars++;
    currentBookStats.accuracy.correctChars++;
    currentBookStats.wpm.correctChars++;
    const ms = resetLastPressed();
    // typingHistory.push([ms, key]);

    if (pageType == "page") {
      nextWordSet();
    }
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
  if (key == " " && settings.handleSpaces == "off" && settings.stopOnError != "word") {
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
  const typedWords = getWordsTyped();
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



// Runs on keypress, adds key to typed list and styles screen appropriately
async function keyPress(e: KeyboardEvent) {
  const eventKey = await getCharFromEvent(e);
  if (text.length > 0 && !$("#typing").hasClass("hidden")) {
    if (canType(eventKey) && !e.ctrlKey) {
      let typedAsWords = getWordsTyped();
      let correctWord = text[typedAsWords.length - 1]
      let typedWord = typedAsWords[typedAsWords.length - 1];

      if (eventKey == "Enter") {
        typed.push("\n");
        typedAsWords = getWordsTyped();
        typedWord = typedAsWords[typedAsWords.length - 1];

      } else {
        if ((settings.handleSpaces == "strict" || settings.stopOnError == "word") && eventKey == " " &&
          typedWord.length == 0) {
          typed.push(new WrongSpace());
        } else if (settings.stopOnError == "word" && eventKey == " " &&
          correctWord != typedWord) {
          typed.push(new WrongSpace());
        } else {
          typed.push(eventKey);
        }
      }
      const keyIsCorrect = checkCorrect();

      let currentTypedWords = getWordsTyped();


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

      if (eventKey == "Enter") {
        if (settings.stopOnError == "word") {
          if (correctWord == typedWord) {
            typed.push(" ")
          }
        } else {
          typed.push(" ");
        }
      }

      currentTypedWords = getWordsTyped();

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

      let key = eventKey;
      if (key == "Enter") {
        key = "\n";
      }
      const keyPress: KeyPress = [ms, key];
      if (keyIsCorrect == false) {
        keyPress.push(1);
      }
      // typingHistory.push(keyPress);

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
        const currentShownWord = getWordShownAtIndex(currentTypedWords.length - 1);

        if (typedWord.length > correctWord.length && typedWord.length > currentShownWord.length) {
          let letter = (eventKey == "Enter") ? "_" : typedWord.substring(typedWord.length - 1);
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
    if (eventKey == " ") {
      e.preventDefault();
    }

    if (e.key == " " || e.key == "Enter" && pageType == "scroll") {
      scrollWords();
    }
  }
}



// Runs on keydown, used for removing letters
function keyDown(e: KeyboardEvent) {
  function removeLetter() {
    // ------------------------- Removes letter styling -----------------------------------
    let currentTypedWords = getWordsTyped();
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

    // const ms = resetLastPressed();
    // if (typingHistory.length > 0) {
    //   let delKey = 0;
    //   let historyDeleting;

    //   // get the keypress that is being backspaced
    //   for (let i = typingHistory.length - 1; i >= 0; i--) {
    //     if (typingHistory[i][1] == "BK") {
    //       delKey++;
    //     } else {
    //       if (delKey == 0) {
    //         historyDeleting = typingHistory[i];
    //         break;
    //       }
    //       delKey--;
    //     }
    //   }

    //   if (historyDeleting) {
    //     const correctBackspace = historyDeleting[2] == 1;
    //     const keyPress: KeyPress = [ms, "BK"];
    //     if (correctBackspace == false) {
    //       keyPress.push(1);
    //     }
    //     typingHistory.push(keyPress);
    //   }
    // }

    // probably shouldn't do this, but i'm gonna do it anyway 😈
    clearTimeout(stopTimerEvent);
    stopTimerEvent = setTimeout(() => {
      stopTimer(5000);
      saveTyping(false);
    }, 5000);

    if (settings.highlightMode == "word") {
      styleWord();
    }

    currentTypedWords = getWordsTyped();
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
    currentTypedWords = getWordsTyped();
    const lastTypedWord = currentTypedWords[currentTypedWords.length - 1];

    const correctWord = text[currentTypedWords.length - 1];
    const currentShownWord = getWordShownAtIndex(currentTypedWords.length - 1);

    if (lastTypedWord.length >= correctWord.length && lastTypedWord.length < currentShownWord.length) {
      const currentEndLetter = $("#words").find("div").eq(currentTypedWords.length - 1).children().eq(currentShownWord.length - 1);
      currentEndLetter.remove();
    }
    // -------------------------------------------------------------
  }
  if (text.length > 0 && !$("#typing").hasClass("hidden")) {
    if (!$("#words").hasClass("hidden") && typed.length > 0) {
      const typedAsWords = getWordsTyped();
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

export function getWordsTyped() {
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
