import {
  switchContent,
  saveTyping,
  settings
} from "./typing.js";
import { BookStats } from "./model/bookStatsModel.js";
import { MetaDataModel } from "./model/metaDataModel.js";

var bookStats: BookStats;
var bookData: MetaDataModel;
export function loadStats(bookId: string) {
  saveTyping();
  bookStats = window.electron.getBookStats(bookId);
  bookData = window.electron.getBookData(bookId);
  loadTimeTyping();
  loadDateCreated();
  // could swap with accuracy chars
  $("#chars-correct").text(bookStats.wpm.correctChars);
  loadWpmAcc();
  $("#sessions").text(bookStats.sessions);

  switchContent("#stats");
}

function loadTimeTyping() {
  const duration = bookStats.wpm.timeTyping + bookStats.saved.wpm.timeTyping;

  var seconds: number | string = Math.floor((duration / 1000) % 60),
    minutes: number | string = Math.floor((duration / (1000 * 60)) % 60),
    hours: number | string = Math.floor(duration / (1000 * 60 * 60));

  hours = (hours < 10) ? "0" + hours : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  $("#time-typing").text(`${hours}:${minutes}:${seconds}`);
}

function loadDateCreated() {
  const date = new Date(bookData.dateStarted)
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][date.getMonth()];

  const hours = ('00' + date.getHours()).slice(-2);
  const minutes = ('00' + date.getMinutes()).slice(-2);
  const seconds = ('00' + date.getSeconds()).slice(-2);


  $("#date-started").text(`Started book on ${weekday}, ${date.getDate()} ${month} ${date.getFullYear()} 
        ${hours}:${minutes}:${seconds}`);
}

function loadWpmAcc() {
  let wpm = 0, rawWpm = 0;

  if (settings.alwaysShowCpm) {
    $("#stats").find("#wpm").parent().find('.title').text("avg cpm");
    $("#stats").find("#raw-wpm").parent().find('.title').text("raw cpm");
  }


  const timeTyping = bookStats.wpm.timeTyping + bookStats.saved.wpm.timeTyping;
  const wpmCorrectChars = bookStats.wpm.correctChars + bookStats.saved.wpm.correctChars;
  const accuracyCorrectChars = bookStats.accuracy.correctChars + bookStats.saved.accuracy.correctChars;
  const accuracyTypedChars = bookStats.accuracy.typedChars + bookStats.saved.accuracy.typedChars;

  if (timeTyping > 0) {
    if (!settings.alwaysShowCpm) {
      wpm = Math.round(wpmCorrectChars / 5 / (timeTyping / 1000 / 60));
      rawWpm = Math.round(accuracyTypedChars / 5 / (timeTyping / 1000 / 60));
    } else {
      wpm = Math.round(wpmCorrectChars / (timeTyping / 1000 / 60));
      rawWpm = Math.round(accuracyTypedChars / (timeTyping / 1000 / 60));
    }
  }

  $("#stats").find('#wpm').text(wpm);
  $("#stats").find('#accuracy').text(`${Math.floor(accuracyCorrectChars / accuracyTypedChars * 100) || 100}%`)
  $("#stats").find('#raw-wpm').text(rawWpm);
}

window.electron.handleLoadInfo(loadStats)