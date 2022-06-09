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

        this.wordCount = 150;
        this.currentTheme = 'serika_dark';
        this.favThemes = [];
    }
}
exports.Settings = Settings;