// This file is to comply with Content Security Policy, which I don't quite understand.
// Inline functions are easier but electron gives me a warning so whatever.
import {
  deleteBook,
  hideDialog,
  confirmDelete,
  showDialog,
  tryHideDialog,
  confirmRestart
} from './dialogs.js';
import { loadStats } from './stats.js';
import { pauseTimer } from './timer.js';
import {
  initTyping,
  continueTyping,
  saveTyping,
  currentBookStats,
  stopTyping,
} from './typing/load-save.js';
import { switchContent } from './window.js';
import {
  prevPage,
  prevChapter,
  nextPage,
  nextChapter
} from './typing/display.js';

$("#app-header").click(continueTyping);
$("#keyboard-header").parents('.text-button').first().click(continueTyping);
$("#library-header").parents('.text-button').first().click(() => {
  switchContent('#library')
});
$("#info-header").parents('.text-button').first().click(() => {
  switchContent('#info')
})
$("#settings-header").parents('.text-button').first().click(() => {
  switchContent('#settings')
});

$(".cancel-dialog").click(() => {
  hideDialog()
});

$("#new-book").click(() => {
  window.electron.createBook()
});
$('#no-book-warning').find("#go-library").click(() => {
  switchContent("#library")
});
$('#book-finished').find("#go-library").click(() => {
  saveTyping();
  switchContent("#library");
  stopTyping();
  hideDialog();
});

$("#book-finished").find("#book-info").click(() => {
  saveTyping();
  loadStats(currentBookStats.bookName);
  stopTyping();
  hideDialog();
});

$("#chap-prev").click(function () {
  prevChapter();
  $(this).blur();
});

$("#page-prev").click(function () {
  prevPage();
  $(this).blur();
});

$("#page-next").click(function () {
  nextPage();
  $(this).blur();
});

$("#chap-next").click(function () {
  nextChapter();
  $(this).blur();
});

$("#cancel-delete").click(hideDialog);
$("#confirm-delete").click(confirmDelete)

$("#book-exists").find("#choose-book").click(() => {
  hideDialog();
  window.electron.createBook()
});

$("#drm-error").find("#choose-book").click(() => {
  hideDialog();
  window.electron.createBook()
});
$("#empty-book").find("#choose-book").click(() => {
  hideDialog();
  window.electron.createBook()
});

$("#dim-content").click(() => {
  tryHideDialog()
});
$("#restart-book-dialog").find("#restart-book").click(() => {
  confirmRestart();
});

$("#play-pause-button").click(function () {
  pauseTimer();
});

window.electron.handleInitTyping(initTyping);
window.electron.handleSaveTyping(saveTyping);
window.electron.handleDeleteBook(deleteBook);
window.electron.handleBookExists(() => {
  showDialog("book-exists")
})
window.electron.handleDRM(() => {
  showDialog("drm-error")
});
window.electron.handleEmptyBook(() => {
  showDialog("empty-book");
});
