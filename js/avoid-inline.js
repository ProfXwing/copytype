// This file is to comply with Content Security Policy, which I don't quite understand.
// Inline functions are easier but electron gives me a warning so whatever.
import {
    deleteBook,
    hideDialog,
    confirmDelete,
    showDialog
} from './dialogs.js';
import {
    initTyping,
    switchContent,
    continueTyping,
    saveTyping,
    nextButton,
    prevButton,
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

$("#book-exists").find("#cancel-dialog").click(() => {hideDialog()});
$("#drm-error").find("#cancel-dialog").click(() => {hideDialog()});

window.electron.handleInitTyping(initTyping);
window.electron.handleSaveTyping(saveTyping);
window.electron.handleDeleteBook(deleteBook);
window.electron.handleBookExists(() => {showDialog("book-exists")});
window.electron.handleDRM(() => {showDialog("drm-error")});