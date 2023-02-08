import { settings } from "./settings.js";

let themesList: Theme[] = [];
let sortedThemesList: Theme[] = [];


setThemes();

// load themes into settings menu
async function setThemes() {
  const themes: Theme[] = await getSortedThemesList();
  for (const theme of themes) {
    if (settings.favThemes.includes(theme.name)) {
      $(".fav-themes").append(
        `<div class="theme button" theme="${theme.name}">
                  <div class="active-indicator"><i class="fas fa-circle"></i></div>
                  <div class="text">${theme.name.replaceAll('_', ' ')}</div>
                  <div class="fav-button active"><i class="fas fa-star"></i></div>
              </div>`
      );
    } else {
      $(".all-themes").append(
        `<div class="theme button" theme="${theme.name}">
                  <div class="active-indicator"><i class="fas fa-circle"></i></div>
                  <div class="text">${theme.name.replaceAll('_', ' ')}</div>
                  <div class="fav-button"><i class="far fa-star"></i></div>
              </div>`
      );
    }

    if (settings.currentTheme == theme.name) {
      $("[theme='" + theme.name + "']").find('.active-indicator').addClass('active');
    }

    $("[theme='" + theme.name + "']").css({
      "color": theme.mainColor,
      "background": theme.bgColor
    });

    $("[theme='" + theme.name + "']").find(".fav-button").click(() => {
      favoriteTheme(theme);
    });

    $("[theme='" + theme.name + "']").click((e) => {
      if (e.target != $("[theme='" + theme.name + "']").find(".fav-button").get()[0]) {
        if (e.target != $("[theme='" + theme.name + "']").find('.fa-star').get()[0]) {
          selectTheme(theme);
        }
      }
    });
  }
}

async function favoriteTheme(theme: Theme) {
  let newThemesList;
  if (!settings.favThemes.includes(theme.name)) {
    settings.favThemes.push(theme.name);
    $("[theme='" + theme.name + "']").find('.fav-button').addClass('active').find(".fa-star").removeClass("far").addClass("fas");
    newThemesList = ".fav-themes";
  } else {
    settings.favThemes.splice(settings.favThemes.indexOf(theme.name), 1);
    $("[theme='" + theme.name + "']").find('.fav-button').removeClass('active').find(".fa-star").addClass("far").removeClass("fas");
    newThemesList = ".all-themes";
  }

  window.electron.saveSettings(settings);

  //  Insert theme into sorted favorites list
  if ($(newThemesList).find('.theme').length > 0) {
    for (const child of $(newThemesList).children()) {
      const childTheme = $(child).attr('theme');
      if (childTheme) {
        const sortedThemes = (await getSortedThemesList() as Theme[]).map(theme => theme.name);
        if (sortedThemes.indexOf(theme.name) < sortedThemes.indexOf(childTheme)) {
          $("[theme='" + theme.name + "']").insertBefore(child);
          return;
        }
      }
    }
  }
  $("[theme='" + theme.name + "']").appendTo($(newThemesList));

}

function selectTheme(theme: Theme) {
  settings.currentTheme = theme.name;

  window.electron.saveSettings(settings);
  loadTheme(theme.name);
}

export async function getSortedThemesList() {
  if (sortedThemesList.length === 0) {
    if (themesList.length === 0) {
      await getThemesList();
    }
    let sorted = [...themesList];
    sorted = sorted.sort((a, b) => {
      const b1 = hexToHSL(a.bgColor);
      const b2 = hexToHSL(b.bgColor);
      return b2.lgt - b1.lgt;
    });
    sortedThemesList = sorted;
    return sortedThemesList;
  } else {
    return sortedThemesList;
  }
}

export async function getThemesList() {
  if (themesList.length == 0) {
    return $.getJSON("../static/themes/_list.json", function (data) {
      const list = data.sort(function (a: Theme, b: Theme) {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
      });
      themesList = list;
      return themesList;
    });
  } else {
    return themesList;
  }
}

export function loadTheme(theme: string) {
  $(".themes-tab").find('.active-indicator.active').removeClass('active');
  $("[theme='" + theme + "']").find('.active-indicator').addClass('active');

  const link = document.createElement("link");
  link.type = "text/css";
  link.rel = "stylesheet";
  link.id = "current-theme";

  link.href = `../static/themes/${theme}.css`;

  const headScript = document.querySelector("#current-theme");
  if (headScript) {
    headScript.replaceWith(link);
  }
}

export function loadCustomTheme() {
  for (const setting in settings.customTheme.styles) {
    if (setting != '--bg-color') {
      $('.customThemeEdit').find(`[for='${setting}']`).css('background-color', settings.customTheme.styles[setting]);
    }

    $('.customThemeEdit').find('#' + setting + "-txt").val(settings.customTheme.styles[setting]);
    $('.customThemeEdit').find('#' + setting).val(settings.customTheme.styles[setting]);
    $(':root').css(setting, settings.customTheme.styles[setting]);
  }
}


// Thanks Mio :blush:
function hexToHSL(hex: string) {
  // Convert hex to RGB first
  let r: number;
  let g: number;
  let b: number;
  if (hex.length == 4) {
    r = parseInt("0x" + hex[1] + hex[1]);
    g = parseInt("0x" + hex[2] + hex[2]);
    b = parseInt("0x" + hex[3] + hex[3]);
  } else if (hex.length == 7) {
    r = parseInt("0x" + hex[1] + hex[2]);
    g = parseInt("0x" + hex[3] + hex[4]);
    b = parseInt("0x" + hex[5] + hex[6]);
  } else {
    r = 0x00;
    g = 0x00;
    b = 0x00;
  }
  // Then to HSL
  r = r / 255;
  r /= 255;
  g /= 255;
  b /= 255;
  const cmin = Math.min(r, g, b);
  const cmax = Math.max(r, g, b);
  const delta = cmax - cmin;
  let h = 0;
  let s = 0;
  let l = 0;

  if (delta == 0) h = 0;
  else if (cmax == r) h = ((g - b) / delta) % 6;
  else if (cmax == g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);

  if (h < 0) h += 360;

  l = (cmax + cmin) / 2;
  s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return {
    hue: h,
    sat: s,
    lgt: l,
    string: "hsl(" + h + "," + s + "%," + l + "%)",
  };
}

export function convertRGBtoHEX(rgb: string) {
  const match = rgb.match(
    /^rgb\((\d+), \s*(\d+), \s*(\d+)\)$/
  );
  if (match === null) return;
  if (match.length < 3) return;

  function hexCode(i: string) {
    // Take the last 2 characters and convert
    // them to Hexadecimal.

    return ("0" + parseInt(i).toString(16)).slice(-2);
  }
  return "#" + hexCode(match[1]) + hexCode(match[2]) + hexCode(match[3]);
}

interface Theme {
  name: string;
  bgColor: string;
  mainColor: string;
}