import { savedTypingHistory } from "./typing.js";

export function sortKeysByTime() {
    // object of keys and their times
    let slowestKeys = {};
    for (let [ms, key, correct] of keyPressesWithoutBackspaces()) {
        if (correct) {
            if (!slowestKeys[key]) {
                slowestKeys[key] = [ms];
            } else {
                slowestKeys[key].push(ms);
            }
        }
    }

    // average the times for each key
    let avgKeys = {};
    for (let [key, times] of Object.entries(slowestKeys)) {
        let sum = times.reduce((a, b) => a + b, 0);
        avgKeys[key] = sum / times.length;
    }

    // sort the keys by average time
    let sortedKeys = Object.entries(avgKeys).sort(([,a], [,b]) => b - a);
    return sortedKeys;
}

export function findSlowestWords() {
    // object of correct words and their time typed
    let wordsTyped = [
        [0, ""]
    ];
    let wordIsCorrect = true;
    for (let [ms, key, correct] of keyPressesWithoutBackspaces()) {
        if (correct == false) {
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

    let slowestWords = {};
    for (let [ms, word] of wordsTyped) {
        let wpm = (word.length / 5) / (ms / 1000) * 60;
        if (!slowestWords[word]) {
            slowestWords[word] = [wpm];
        } else {
            slowestWords[word].push(wpm);
        }
    }

    let avgWords = {};
    for (let [word, times] of Object.entries(slowestWords)) {
        let sum = times.reduce((a, b) => a + b, 0);
        avgWords[word] = sum / times.length;
    }

    let sortedWords = Object.entries(avgWords).sort(([,a], [,b]) => a - b);
    return sortedWords;
}

// add backspace and deleted keypresses to next keypress
export function keyPressesWithoutBackspaces() {
    let keyPresses = [];
    
    let msToAdd = 0;
    for (let [ms, key, correct] of savedTypingHistory) {
        keyPresses.push([ms, key, correct]);

        if (key == "Backspace") {
            keyPresses.pop();
            let deleted = keyPresses.pop();
            msToAdd += ms + deleted[0];
        } else {
            keyPresses[keyPresses.length - 1][0] += msToAdd;
            msToAdd = 0;
        }
    }
    return keyPresses;
}

export function saveTypingHistory(savedTypingHistory) {
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

    let unsaved = [];
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
