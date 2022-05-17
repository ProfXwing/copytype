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
import {
    initTyping,
    switchContent,
    continueTyping,
    saveTyping,
    nextButton,
    prevButton,
    currentBookStats,
    stopTyping,
} from './typing.js';

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
    hideDialog();
});

$("#book-finished").find("#book-info").click(() => {
    stopTyping();
    loadStats(currentBookStats.bookName);
    hideDialog();
})


$("#page-prev").click(function () {
    prevButton();
    $(this).blur();
})

$("#page-next").click(function () {
    nextButton();
    $(this).blur();
})

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


$("#dim-content").click(() => {
    tryHideDialog()
});
$("#restart-book-dialog").find("#restart-book").click(() => {
    confirmRestart();
});


window.electron.handleInitTyping(initTyping);
window.electron.handleSaveTyping(saveTyping);
window.electron.handleDeleteBook(deleteBook);
window.electron.handleBookExists(() => {
    showDialog("book-exists")
});
window.electron.handleDRM(() => {
    showDialog("drm-error")
});