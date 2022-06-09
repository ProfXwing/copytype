import { showDialog, hideDialog } from "./dialogs.js";
import {
    currentBookStats,
    settings,
    saveAndReload
} from "./typing.js";
import { loadTheme } from './themes.js';

var fontSizeInput = $(".fontSize").find("input");
var removeFromTextInput = $(".removeFromText").find("input");

loadSettings();

for (let setting in settings) {
    $(`.pageSettings .section.${setting} .button`).click(function () {
        if (typeof settings[setting] == "boolean") {
            settings[setting] = $(this).attr(setting) == "true";
        } else {
            settings[setting] = $(this).attr(setting);
        }

        if ($(this).attr('redoText') == 'true' && currentBookStats) {
            saveAndReload();
        }

        $(`.pageSettings .section.${setting} .button`).removeClass("active");
        $(this).addClass("active");
        $(this).blur()
        window.electron.saveSettings(settings);
    });
}


removeFromTextInput.on('input propertychange paste', function() {
    settings.removeFromText = $(this).val().split("");
    window.electron.saveSettings(settings);
});

// Set only if input is a valid number
fontSizeInput.on('input propertychange paste', function() {
    let val = $(this).val();
    let parsedFloat = parseFloat($(this).val());

    if (val == "" || isNaN(parsedFloat)) {
        return;
    }
    if (isNaN(parsedFloat)) {
        return;
    }
    if (parsedFloat.toString() == $(this).val() || 
    (parsedFloat.toString() + "." == $(this).val()) && parsedFloat.toString().indexOf(".") == -1) {
        settings.fontSize = parseFloat($(this).val());
        window.electron.saveSettings(settings);
    } else {
        $(this).val(settings.fontSize);
    }
});

$(".importexportSettings .buttons .import").click(()=>{
    showDialog('settingsImport');
});

$(".importexportSettings .buttons .export").click(()=>{
    navigator.clipboard.writeText(JSON.stringify(settings));
});

$("#settingsImport .button").click(()=>{
    let text = $("#settingsImport input").val();
    let newSettings = JSON.parse(text);
    for (let setting in newSettings) {
        settings[setting] = newSettings[setting];
    }
    window.electron.saveSettings(settings);
    loadSettings();
    hideDialog();
});

$(".resetSettings .buttons .button").click(()=>{
    showDialog("resetSettingsDialog");
});

$("#resetSettingsDialog").find("#reset-settings").click(()=>{
    // because i don't know how to reassign imported vars
    for (let setting in window.electron.defaultSettings()) {
        settings[setting] = window.electron.defaultSettings()[setting];
    }
    loadSettings();
    hideDialog();
});

$(".sectionGroupTitle").click(function () {
    toggleSettingsGroup($(this).attr("group"));
});



function loadSettings() {
    for (let setting in settings) {
        $(`.pageSettings .section.${setting} .button`).removeClass("active");
        $(`.pageSettings .section.${setting} .button[${setting}='${settings[setting]}']`).addClass("active");
    }
    removeFromTextInput.val(settings.removeFromText.join(""));
    fontSizeInput.val(settings.fontSize);

    loadTheme(settings.currentTheme)
}

function toggleSettingsGroup(groupName) {
    $(`.pageSettings .settingsGroup.${groupName}`)
      .stop(true, true)
      .slideToggle(250)
      .toggleClass("slideup");
    if ($(`.pageSettings .settingsGroup.${groupName}`).hasClass("slideup")) {
      $(`.pageSettings .sectionGroupTitle[group=${groupName}] .fas`)
        .stop(true, true)
        .animate(
          {
            deg: -90,
          },
          {
            duration: 250,
            step: function (now) {
              $(this).css({
                transform: "rotate(" + now + "deg)",
              });
            },
          }
        );
    } else {
      $(`.pageSettings .sectionGroupTitle[group=${groupName}] .fas`)
        .stop(true, true)
        .animate(
          {
            deg: 0,
          },
          {
            duration: 250,
            step: function (now) {
              $(this).css({
                transform: "rotate(" + now + "deg)",
              });
            },
          }
        );
    }
  }