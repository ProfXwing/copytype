import { settings } from "./typing.js";

for (let setting in settings) {
    if (typeof settings[setting] == "boolean") {
        $(`.pageSettings .section.${setting} .button[${setting}='${settings[setting]}']`).addClass("active");

        $(`.pageSettings .section.${setting} .button`).click(function () {
            settings[setting] = $(this).attr(setting) == "true";
            $(`.pageSettings .section.${setting} .button`).removeClass("active");
            $(this).addClass("active");
            $(this).blur()
            window.electron.saveSettings(settings);
        });
    }
}