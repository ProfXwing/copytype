import {
    switchContent,
    saveTyping,
    settings
} from "./typing.js";

var bookStats;
var bookData;
export function loadStats(bookId) {
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
    let duration = bookStats.wpm.timeTyping + bookStats.saved.wpm.timeTyping;

    var seconds = Math.floor((duration / 1000) % 60),
        minutes = Math.floor((duration / (1000 * 60)) % 60),
        hours = Math.floor(duration / (1000 * 60 * 60));

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    $("#time-typing").text(`${hours}:${minutes}:${seconds}`);
}

function loadDateCreated() {
    let date = new Date(bookData.dateStarted)
    let weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
    let month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][date.getMonth()];
    
    let hours = ('00'+date.getHours()).slice(-2);
    let minutes = ('00'+date.getMinutes()).slice(-2);
    let seconds = ('00'+date.getSeconds()).slice(-2);


    $("#date-started").text(`Started book on ${weekday}, ${date.getDate()} ${month} ${date.getFullYear()} 
        ${hours}:${minutes}:${seconds}`);
}

function loadWpmAcc() {
    let wpm = 0, rawWpm = 0;

    if (settings.alwaysShowCpm) {
        $("#stats").find("#wpm").parent().find('.title').text("avg cpm");
        $("#stats").find("#raw-wpm").parent().find('.title').text("raw cpm");
    }


    let timeTyping = bookStats.wpm.timeTyping + bookStats.saved.wpm.timeTyping;
    let wpmCorrectChars = bookStats.wpm.correctChars + bookStats.saved.wpm.correctChars;
    let accuracyCorrectChars = bookStats.accuracy.correctChars + bookStats.saved.accuracy.correctChars;
    let accuracyTypedChars = bookStats.accuracy.typedChars + bookStats.saved.accuracy.typedChars;

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