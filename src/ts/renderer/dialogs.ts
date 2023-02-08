import {
  currentBookStats,
  initTyping,
  stopTyping,
} from "./typing/load-save.js";

var bookToDelete: string;
var bookToRestart: string;
export var themeToDelete: number;
export var themeToUpdate: number;

// limitation of one dialog at a time, can change if needed.
var currentDialog: string;

export function showDialog(id: string) {
  currentDialog = id;
  $("#dim-content").removeClass("hidden");
  $("#" + id).removeClass("hidden");
}

export function hideDialog() {
  $("#" + currentDialog).addClass("hidden");
  $("#dim-content").addClass("hidden");

}

export function deleteBook(bookId: string, bookTitle: string) {
  bookToDelete = bookId;
  $("#book-to-delete").text(bookTitle);
  showDialog('delete-warning');
}

export function tryRestartBook(book: string) {
  bookToRestart = book;
  showDialog("restart-book-dialog")
}

export function confirmRestart() {
  window.electron.restartBook(bookToRestart);
  hideDialog();
  initTyping(bookToRestart);
}

export function confirmDelete() {
  if (currentBookStats) {
    if (currentBookStats.bookName == bookToDelete) {
      stopTyping();
    }
  }
  window.electron.deleteBook(bookToDelete);
  hideDialog();
}

export function tryHideDialog() {
  if (currentDialog == "book-finished") {
    return;
  }
  hideDialog();
}

export function deleteThemeDialog(themeIndex: number) {
  themeToDelete = themeIndex;
  showDialog("delete-theme-dialog");
}

export function updateThemeDialog(index: number, name: string) {
  themeToUpdate = index;
  $('#update-theme-dialog [type="text"]').val(name);
  showDialog("update-theme-dialog");
}