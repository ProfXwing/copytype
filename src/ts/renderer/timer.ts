import {
  stopTimerEvent
} from "./typing/test.js";
import {
  currentBookStats,
  saveTyping,
} from "./typing/load-save.js"
import { settings } from "./settings.js";
import { getCorrectChars } from "./stats.js"

var startTime: number;
export var timerStarted = false;
var timeLastPressed: number;

export function updateStats() {
  if (currentBookStats) {
    let correctChars;
    if (!settings.blindMode) {
      correctChars = currentBookStats.wpm.correctChars + getCorrectChars();
    } else {
      correctChars = currentBookStats.accuracy.typedChars + getCorrectChars();
    }

    let wpm: string | number = 0;
    if (timerStarted) {
      const timeTyping = (Date.now() - startTime + currentBookStats.wpm.timeTyping) / 1000 / 60;

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

export function stopTimer(timeRemoved = 0) {
  if (timerStarted) {
    currentBookStats.wpm.timeTyping += Date.now() - startTime - timeRemoved;
    timerStarted = false;
    playPauseToggle();
  }
}

export function startTimer() {
  if (!timerStarted) {
    startTime = Date.now();
    timeLastPressed = Date.now();
    timerStarted = true;
    playPauseToggle();
  }
}

export function resetLastPressed() {
  let timeSinceTyped = 0;
  if (timeLastPressed) {
    timeSinceTyped = Date.now() - timeLastPressed;
  }
  timeLastPressed = Date.now();
  return timeSinceTyped;
}

export function decrementLastPressed(decrementBy: number) {
  timeLastPressed -= decrementBy;
}


export function pauseTimer() {
  if (timerStarted) {
    clearTimeout(stopTimerEvent);
    stopTimer(Date.now() - timeLastPressed);
    saveTyping(false);
  } else {
    startTimer();
  }
  playPauseToggle();
}

export function playPauseToggle() {
  if (timerStarted) {
    $("#play-pause-button").find("i").removeClass("fa-circle-play").addClass("fa-circle-pause");
    $("#pause-menu").animate({
      width: "37px"
    }, 200);
  } else {
    $("#play-pause-button").find("i").removeClass("fa-circle-pause").addClass("fa-circle-play");
    $("#pause-menu").animate({
      width: "191.4px"
    }, 200);
  }
}

