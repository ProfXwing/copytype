import { initTyping } from "./typing/load-save.js";
import { nextWordSet } from "./typing/display.js";
import { getSettings } from "./settings.js";

var libraryLoaded = false;

// Quick start into current book
if (getSettings().currentBook) {
  initTyping(getSettings().currentBook);
}

// Load starting page
window.onload = function () {
  $("#main-page").removeClass("hidden");

  if (getSettings().currentBook) {
    switchContent("#typing");
    nextWordSet(true);
  } else {
    switchContent("#library");
  }
}

// Page switcher
export function switchContent(div: string) {
  for (const child of $("#middle").children()) {
    $(child).addClass("hidden");
  }

  $("#no-book-warning").addClass("hidden");

  $(div).removeClass("hidden");

  if (div == "#library" && !libraryLoaded) {
    libraryLoaded = true;
    window.electron.loadLibrary();
  }
}

export function setLibraryLoaded(value: boolean) {
  libraryLoaded = value;
}