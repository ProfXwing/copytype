import {
    settings
} from "./typing.js";

for (let setting in settings) {
    $(`.pageSettings .section.${setting} .button[${setting}='${settings[setting]}']`).addClass("active");

    $(`.pageSettings .section.${setting} .button`).click(function () {
        if (typeof settings[setting] == "boolean") {
            settings[setting] = $(this).attr(setting) == "true";
        } else {
            settings[setting] = $(this).attr(setting);
        }
        $(`.pageSettings .section.${setting} .button`).removeClass("active");
        $(this).addClass("active");
        $(this).blur()
        window.electron.saveSettings(settings);
    });
}