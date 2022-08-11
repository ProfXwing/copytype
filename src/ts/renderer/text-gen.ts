import { savedTypingHistory } from "./typing.js";
import { KeyPress, TypingHistory } from "./model/typingHistoryModel.js";

export function sortKeysByTime() {
  // object of keys and their times
  const slowestKeys: {
    [key: string]: number[];
  } = {};
  for (const [ms, key, incorrect] of keyPressesWithoutBackspaces()) {
    if (!incorrect) {
      if (!slowestKeys[key]) {
        slowestKeys[key] = [ms];
      } else {
        slowestKeys[key].push(ms);
      }
    }
  }

  // average the times for each key
  const avgKeys: {
    [key: string]: number;
  } = {};
  for (const [key, times] of Object.entries(slowestKeys)) {
    const sum = times.reduce((a, b) => a + b, 0);
    avgKeys[key] = sum / times.length;
  }

  // sort the keys by average time
  const sortedKeys = Object.entries(avgKeys).sort(([, a], [, b]) => b - a);
  return sortedKeys;
}

export function findSlowestWords() {
  // object of correct words and their time typed
  const wordsTyped: [number, string][] = [
    [0, ""]
  ];
  let wordIsCorrect = true;
  for (const [ms, key, incorrect] of keyPressesWithoutBackspaces()) {
    if (incorrect == true) {
      wordIsCorrect = false;
    }

    if (key == " " || key == "Enter") {
      if (wordIsCorrect == false) {
        wordsTyped.pop();
        wordIsCorrect = true;
      }
      // todo: think about adding time taken to space out of word.
      wordsTyped.push([0, ""]);
    } else {
      wordsTyped[wordsTyped.length - 1][0] += ms;
      wordsTyped[wordsTyped.length - 1][1] += key;
    }
  }

  if (wordsTyped[wordsTyped.length - 1][1] == "") {
    wordsTyped.pop();
  }

  const slowestWords: {
    [key: string]: number[];
  } = {};
  for (const [ms, word] of wordsTyped) {
    const wpm = (word.length / 5) / (ms / 1000) * 60;
    if (!slowestWords[word]) {
      slowestWords[word] = [wpm];
    } else {
      slowestWords[word].push(wpm);
    }
  }

  const avgWords: {
    [key: string]: number;
  } = {};
  for (const [word, times] of Object.entries(slowestWords)) {
    const sum = times.reduce((a, b) => a + b, 0);
    avgWords[word] = sum / times.length;
  }

  const sortedWords = Object.entries(avgWords).sort(([, a], [, b]) => a - b);
  return sortedWords;
}

// add backspace and deleted keypresses to next keypress
export function keyPressesWithoutBackspaces() {
  const keyPresses = [];

  let msToAdd = 0;
  for (const [ms, key, incorrect] of savedTypingHistory) {
    keyPresses.push([ms, key, incorrect ? true : false]);

    if (key == "BK") {
      keyPresses.pop();
      const deleted = keyPresses.pop();
      msToAdd += ms + deleted[0];
    } else {
      keyPresses[keyPresses.length - 1][0] += msToAdd;
      msToAdd = 0;
    }
  }
  return keyPresses;
}

export function saveTypingHistory(savedTypingHistory: TypingHistory) {
  // save last 200k keypresses
  while (savedTypingHistory.length > 200000) {
    let foundSpace = false;
    while (foundSpace == false) {
      if (savedTypingHistory[0][1] == " " || savedTypingHistory[0][1] == "Enter") {
        foundSpace = true;
      }
      savedTypingHistory.shift();
    }
  }

  const unsaved = [];
  if (savedTypingHistory.length > 0) {
    let lastKeyPress = savedTypingHistory[savedTypingHistory.length - 1][1];
    while (lastKeyPress != " " && lastKeyPress != "Enter") {
      unsaved.unshift(savedTypingHistory.pop());
      lastKeyPress = savedTypingHistory[savedTypingHistory.length - 1][1];
    }
  }

  window.electron.saveTypingHistory(savedTypingHistory);
  return unsaved;
} 
