import {
    currentBookStats,
    getCorrectChars,
    settings
} from "./typing.js";

var startTime;
export var timerStarted = false;

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

            if (!settings.alwaysShowCpm) {
                wpm = Math.round(correctChars / 5 / timeTyping);
            } else {
                wpm = Math.round(correctChars / timeTyping);
            }

        } else if (currentBookStats.wpm.timeTyping != 0) {
            if (!settings.alwaysShowCpm) {
                wpm = Math.round(correctChars / 5 / (currentBookStats.wpm.timeTyping / 1000 / 60));
            } else {
                wpm = Math.round(correctChars / (currentBookStats.wpm.timeTyping / 1000 / 60));
            }
        }

        if (!settings.alwaysShowCpm) {
            wpm = `${wpm}WPM`;
        } else {
            wpm = `${wpm}CPM`;
        }

        let accuracy;
        if (!settings.blindMode) {
            accuracy = Math.floor(currentBookStats.accuracy.correctChars / currentBookStats.accuracy.typedChars * 100);
        }
        if (!accuracy) {
            accuracy = 100;
        }

        $("#wpm-counter").text(`${wpm}`);
        $("#acc-counter").text(`${accuracy}%`)
    }
}

export function stopTimer(timeRemoved=0) {
    if (timerStarted) {
        currentBookStats.wpm.timeTyping += Date.now() - startTime - timeRemoved;
        timerStarted = false;
    }
}

export function startTimer() {
    if (!timerStarted) {
        startTime = Date.now();
        timerStarted = true;
    }
}