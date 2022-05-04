import {
    currentBookStats,
    getCorrectChars,
    settings
} from "./typing.js";

var startTime;
var timerStarted = false;

export function updateStats() {
    if (currentBookStats) {
        let correctChars;
        if (!settings.blindMode) {
            correctChars = currentBookStats.wpm.correctChars + getCorrectChars();
        } else {
            correctChars = currentBookStats.accuracy.typedChars + getCorrectChars();
        }

        let wpm = 0;
        if (timerStarted) {
            let timeTyping = (Date.now() - startTime + currentBookStats.wpm.timeTyping) / 1000 / 60;
            wpm = Math.round(correctChars / 5 / timeTyping);

        } else if (currentBookStats.wpm.timeTyping != 0) {
            wpm = Math.round(correctChars / 5 / (currentBookStats.wpm.timeTyping / 1000 / 60));
        }

        let accuracy;
        if (!settings.blindMode) {
            accuracy = Math.floor(currentBookStats.accuracy.correctChars / currentBookStats.accuracy.typedChars * 100);
        }
        if (!accuracy) {
            accuracy = 100;
        }

        $("#wpm-counter").text(`${wpm}WPM`);
        $("#acc-counter").text(`${accuracy}%`)
    }
}

export function stopTimer() {
    if (timerStarted) {
        currentBookStats.wpm.timeTyping += Date.now() - startTime - 5000;
        timerStarted = false;
    }
}

export function startTimer() {
    if (!timerStarted) {
        startTime = Date.now();
        timerStarted = true;
    }
}