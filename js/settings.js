import { showDialog, hideDialog, deleteThemeDialog, themeToDelete, updateThemeDialog, themeToUpdate } from "./dialogs.js";
import {
    currentBookStats,
    settings,
    saveAndReload,
    loadLibrary
} from "./typing.js";
import { loadCustomTheme, loadTheme } from './themes.js';
import { normalizeText } from "./misc.js";
import { addNotification } from "./notifications.js";

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

        if ($(this).attr('redoLibrary') == 'true') {
            for (let child of $("#library").children()) {
                if (child.id != 'new-book') {
                    $(child).remove();
                }
            }
            loadLibrary();
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
    saveAndReload();
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

$('.colorPicker [type="text"]').keypress(function(e) {
    if (e.key == "Enter") {
        let reg = /^#([0-9a-f]{3}){1,2}$/i;
        if (reg.test($(this).val())) {
            let id = $(this).attr('id');
            let cssVar = id.substring(0, id.indexOf('-txt'));
            settings.customTheme.styles[cssVar] = $(this).val();
            window.electron.saveSettings(settings);
            loadCustomTheme();
        }
    }
})

$(".colorPicker [type='color']").on('input', function () {
    let reg = /^#([0-9a-f]{3}){1,2}$/i;
    if (reg.test($(this).val())) {
        let cssVar = $(this).attr('id');
        settings.customTheme.styles[cssVar] = $(this).val();
        window.electron.saveSettings(settings);
        loadCustomTheme();
    }
});

$(".importexportSettings .buttons .import").click(()=>{
    showDialog('settingsImport');
});

$(".importexportSettings .buttons .export").click(()=>{
    navigator.clipboard.writeText(JSON.stringify(settings));
    addNotification('notice', 'Settings exported to clipboard');
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

$(".themes .tabs [tab]").click(function () {
    settings.themeType = $(this).attr("tab");
    window.electron.saveSettings(settings);
    loadSettings();
});

$('.customThemeEdit').find('.saveCustomThemeButton').click(function () {
    settings.savedCustomThemes.push(structuredClone(settings.customTheme));
    window.electron.saveSettings(settings);
    loadSavedThemes();
});

$(".customThemeEdit").find("#loadCustomColorsFromPreset").click(function () {
    for (let setting in settings.customTheme.styles) {
        $(':root').css(setting, '')
    }

    let style = getComputedStyle(document.body);
    for (let setting in settings.customTheme.styles) {
        settings.customTheme.styles[setting] = style.getPropertyValue(setting).replaceAll(" ", "");
    }
    window.electron.saveSettings(settings);
    loadThemeAndType();
})

$(".customThemeEdit").find("#exportCustomTheme").click(function () {
    let text = JSON.stringify(settings.customTheme);
    navigator.clipboard.writeText(text);
    addNotification('notice', 'Custom theme exported to clipboard');
});

$(".customThemeEdit").find("#importCustomTheme").click(function () {
    showDialog("themeImport");
}); 

$("#themeImport .button").click(function () {
    let text = $("#themeImport input").val();
    let newTheme = JSON.parse(text);
    settings.customTheme = newTheme;
    window.electron.saveSettings(settings);
    loadThemeAndType();
    hideDialog();
});

function loadSettings() {
    for (let setting in settings) {
        if (typeof settings[setting] == "boolean" || typeof settings[setting] == "string") {
            $(`.pageSettings .section.${setting} .button`).removeClass("active");
            $(`.pageSettings .section.${setting} .button[${setting}='${settings[setting]}']`).addClass("active");
        }
    }
    removeFromTextInput.val(settings.removeFromText.join(""));
    fontSizeInput.val(settings.fontSize);

    loadSavedThemes();
    loadThemeAndType();

}

function loadThemeAndType() {
    $(".themes .tabs [tab]").removeClass("active");
    $(`.themes .tabs [tab='${settings.themeType}']`).addClass("active");
    $(".themes").find("[tabcontent]").addClass("hidden");
    $(".themes").find(`[tabcontent='${settings.themeType}']`).removeClass("hidden");

    loadTheme(settings.currentTheme);

    if (settings.themeType == 'custom') {
        loadCustomTheme();
    } else {
        for (let setting in settings.customTheme.styles) {
            $(':root').css(setting, '')
        }
    }
}

export function loadSavedThemes() {
    $(".customTheme .allCustomThemes").empty();

    for (let theme of settings.savedCustomThemes) {
        $(".customTheme .allCustomThemes").append(`
        <div class="customTheme button">
            <div class="editButton"><i class="fas fa-pen"></i></div>
            <div class="text"></div>
            <div class="delButton"><i class="fas fa-trash fa-fw"></i></div>
        </div>`);

        let customTheme = $(".customTheme .allCustomThemes").find(".customTheme").last();
        customTheme.css({
            'color': theme.styles['--main-color'],
            'background-color': theme.styles['--bg-color']
        })

        customTheme.find(".text").text(theme.name);

        customTheme.find(".delButton").click(function () {
            let index = settings.savedCustomThemes.indexOf(theme);
            deleteThemeDialog(index);
        });

        customTheme.find(".editButton").click(function () {
            let index = settings.savedCustomThemes.indexOf(theme);
            updateThemeDialog(index, theme.name);
        });

        customTheme.click(function (e) {
            if (e.target != $(this).find(".editButton")[0] && e.target != $(this).find(".delButton")[0]) {
                settings.customTheme = structuredClone(theme);
                window.electron.saveSettings(settings);
                loadCustomTheme();
            }
        });
    }
}

$("#delete-theme-dialog").find("#delete-theme").click(deleteTheme);
function deleteTheme() {
    settings.savedCustomThemes.splice(themeToDelete, 1);
    window.electron.saveSettings(settings);
    hideDialog();
    loadSavedThemes();
}

$("#update-theme-dialog").find("#update-theme").click(updateTheme);
function updateTheme() {
    let newName = $("#update-theme-dialog input").val();
    newName = normalizeText(newName);
    if (newName != "") {
        settings.savedCustomThemes[themeToUpdate].name = newName;
    }
    let checked = $("#update-theme-dialog input").is(":checked");
    if (checked) {
        for (let style in settings.customTheme.styles) {
            settings.savedCustomThemes[themeToUpdate].styles[style] = settings.customTheme.styles[style];
        }
        $("#update-theme-dialog .checkbox input").prop("checked", false);
    }
    if (newName != "" || checked) {
        window.electron.saveSettings(settings);
        loadSavedThemes();
    }
    hideDialog();
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