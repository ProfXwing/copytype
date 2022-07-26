const { CustomTheme } = require("./customThemeModel");

class Settings {
    constructor() {
        this.blindMode = false;
        this.strictSpace = false;
        this.smoothCaret = true;
        this.stopOnError = 'off';
        this.confidenceMode = 'off';
        this.indicateTypos = 'off';
        this.hideExtraLetters = false;
        this.lazyMode = false;
        this.caretStyle = 'default';
        this.highlightMode = 'letter';
        this.alwaysShowCpm = false;
        this.fontSize = 2.3;
        this.flipTestColors = false;
        this.colorfulMode = false;
        this.showLiveWpm = false;
        this.showLiveAcc = false;
        this.capsLockWarning = true;
        this.showPageLabel = 'off';
        this.removeFromText = [];
        this.removePunctuation = false;
        this.removeCaps = false;
        this.removeNewLine = false;
        this.pageNavigation = true;
        this.chapterNavigation = true;
        this.pausePlayButton = true;

        this.wordCount = 150; // todo: how many words are loaded, would be great if this was automatic 
        this.currentTheme = 'serika_dark';
        this.themeType = 'preset'; //preset, custom
        this.savedCustomThemes = [];
        this.customTheme = new CustomTheme();
        this.favThemes = [];

        this.bookSort = 'recent' // recent, alphabetical
        this.recentBooks = []; 

        // this.typingHistory = [];
    }
}
exports.Settings = Settings;