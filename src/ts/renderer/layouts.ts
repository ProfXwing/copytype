import { capsState } from "./caps.js";
import { settings } from "./settings.js";

var dropdownOpen = false;
var dropdown = $(".pageSettings .section.layoutEmulator .dropdown");
var layoutsMenu = dropdown.find(".layouts");
var selectedLayout = $(".pageSettings .section.layoutEmulator .selected-layout");

createLayout("off");

var layouts;
var layout;

function setLayout(newLayout: string) {
  if (newLayout == "off") {
    layout = null;
  }
  layout = layouts[newLayout];
}

$.getJSON("../static/layouts/_list.json").then((data: { key: string }) => {
  layouts = data;
  for (const layout of Object.keys(layouts)) {
    createLayout(layout);
  }
  setLayout(settings.layoutEmulator);
});

function createLayout(layout: string) {
  const elem = $(`<div class="layout" layout="${layout}">${layout}</div>`);
  elem.on('click', function () {
    settings.layoutEmulator = $(this).attr("layout") as string;
    selectedLayout.text(settings.layoutEmulator);
    window.electron.saveSettings(settings);
    setLayout(settings.layoutEmulator);

    $(this).parent().children().removeClass("active");
    $(this).addClass("active");
    dropdownOpen = false;
    $(".pageSettings .section.layoutEmulator .button").removeClass("active");
  })
  layoutsMenu.append(elem);
}

layoutsMenu.children().each(function () {
  if ($(this).attr("layout") == settings.layoutEmulator) {
    $(this).addClass("active");
  }
});

selectedLayout.text(settings.layoutEmulator);

dropdown.find("input").on("input", function () {
  const val = $(this).val() as string;
  layoutsMenu.find(".layout").each(function () {
    if ($(this).attr("layout")?.toLowerCase().includes(val.toLowerCase())) {
      $(this).show();
    } else {
      $(this).hide();
    }
  })
});

$(".pageSettings .section.layoutEmulator .button").on("click", function (e: JQuery.ClickEvent) {
  // Don't close dropdown if clicked on dropdown
  if (isChildOf(e.target, dropdown[0])) return;

  dropdownOpen = !dropdownOpen;
  if (dropdownOpen) {
    $(this).addClass("active");
    resizeDropdown();
    $(this).find("input").trigger('focus');
  } else {
    $(this).removeClass("active");
  }
});

function isChildOf(child: HTMLElement, parent: HTMLElement) {
  while (child.parentElement) {
    if (child.parentElement == parent) return true;
    child = child.parentElement;
  }
  return false;
}

$(window).on("resize", resizeDropdown);

function resizeDropdown() {
  if (dropdownOpen) {
    const dropdown = $(".pageSettings .section.layoutEmulator .dropdown");
    const button = $(".pageSettings .section.layoutEmulator .button");

    const width = button[0].getBoundingClientRect().width;

    dropdown.css("width", width - 2 + "px");
  }
}


// Thank you mio
export async function getCharFromEvent(
  event: KeyboardEvent
): Promise<string | null> {
  function emulatedLayoutShouldShiftKey(
    event: KeyboardEvent,
    newKeyPreview: string
  ): boolean {
    if (capsState) return isASCIILetter(newKeyPreview) !== event.shiftKey;
    return event.shiftKey;
  }

  if (!layout) return event.key;

  let keyEventCodes: string[] = [];

  if (layout.type === "ansi") {
    keyEventCodes = [
      "Backquote",
      "Digit1",
      "Digit2",
      "Digit3",
      "Digit4",
      "Digit5",
      "Digit6",
      "Digit7",
      "Digit8",
      "Digit9",
      "Digit0",
      "Minus",
      "Equal",
      "KeyQ",
      "KeyW",
      "KeyE",
      "KeyR",
      "KeyT",
      "KeyY",
      "KeyU",
      "KeyI",
      "KeyO",
      "KeyP",
      "BracketLeft",
      "BracketRight",
      "Backslash",
      "KeyA",
      "KeyS",
      "KeyD",
      "KeyF",
      "KeyG",
      "KeyH",
      "KeyJ",
      "KeyK",
      "KeyL",
      "Semicolon",
      "Quote",
      "KeyZ",
      "KeyX",
      "KeyC",
      "KeyV",
      "KeyB",
      "KeyN",
      "KeyM",
      "Comma",
      "Period",
      "Slash",
      "Space",
    ];
  } else if (layout.type === "iso") {
    keyEventCodes = [
      "Backquote",
      "Digit1",
      "Digit2",
      "Digit3",
      "Digit4",
      "Digit5",
      "Digit6",
      "Digit7",
      "Digit8",
      "Digit9",
      "Digit0",
      "Minus",
      "Equal",
      "KeyQ",
      "KeyW",
      "KeyE",
      "KeyR",
      "KeyT",
      "KeyY",
      "KeyU",
      "KeyI",
      "KeyO",
      "KeyP",
      "BracketLeft",
      "BracketRight",
      "KeyA",
      "KeyS",
      "KeyD",
      "KeyF",
      "KeyG",
      "KeyH",
      "KeyJ",
      "KeyK",
      "KeyL",
      "Semicolon",
      "Quote",
      "Backslash",
      "IntlBackslash",
      "KeyZ",
      "KeyX",
      "KeyC",
      "KeyV",
      "KeyB",
      "KeyN",
      "KeyM",
      "Comma",
      "Period",
      "Slash",
      "Space",
    ];
  } else if (layout.type === "matrix") {
    keyEventCodes = [
      "Backquote",
      "Digit1",
      "Digit2",
      "Digit3",
      "Digit4",
      "Digit5",
      "Digit6",
      "Digit7",
      "Digit8",
      "Digit9",
      "Digit0",
      "Minus",
      "Equal",
      "KeyQ",
      "KeyW",
      "KeyE",
      "KeyR",
      "KeyT",
      "KeyY",
      "KeyU",
      "KeyI",
      "KeyO",
      "KeyP",
      "BracketLeft",
      "BracketRight",
      "Backslash",
      "KeyA",
      "KeyS",
      "KeyD",
      "KeyF",
      "KeyG",
      "KeyH",
      "KeyJ",
      "KeyK",
      "KeyL",
      "Semicolon",
      "Quote",
      "KeyZ",
      "KeyX",
      "KeyC",
      "KeyV",
      "KeyB",
      "KeyN",
      "KeyM",
      "Comma",
      "Period",
      "Slash",
      "Space",
    ];
  }

  const layoutKeys = layout.keys;

  const layoutMap = layoutKeys["row1"]
    .concat(layoutKeys["row2"])
    .concat(layoutKeys["row3"])
    .concat(layoutKeys["row4"])
    .concat(layoutKeys["row5"]);

  let mapIndex = null;
  for (let i = 0; i < keyEventCodes.length; i++) {
    if (event.code == keyEventCodes[i]) {
      mapIndex = i;
    }
  }
  if (!mapIndex) {
    if (event.code.includes("Numpad")) {
      return event.key;
    } else {
      return null;
    }
  }
  const newKeyPreview = layoutMap[mapIndex][0];
  const shift = emulatedLayoutShouldShiftKey(event, newKeyPreview) ? 1 : 0;
  const char = layoutMap[mapIndex][shift];
  if (char) {
    return char;
  } else {
    return event.key;
  }
}

// I love you mio
export function isASCIILetter(c: string): boolean {
  return c.length === 1 && /[a-z]/i.test(c);
}