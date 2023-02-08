// It would be fantastic if I could setup tsconfig in a way that didn't require two model folders.
export class Settings {
  blindMode = false;
  handleSpaces = "off";
  smoothCaret = true;
  stopOnError = 'off';
  confidenceMode = 'off';
  layoutEmulator = 'off';

  indicateTypos = 'off';
  hideExtraLetters = false;
  lazyMode = false;
  caretStyle = 'default';
  highlightMode = 'letter';
  alwaysShowCpm = false;
  fontSize = 2.3;
  flipTestColors = false;
  colorfulMode = false;
  showLiveWpm = true;
  showLiveAcc = true;
  capsLockWarning = true;
  showPageLabel = 'off';
  removeFromText: string[] = [];
  removePunctuation = false;
  removeCaps = false;
  removeNewLine = false;
  pageNavigation = true;
  chapterNavigation = true;
  pausePlayButton = true;

  wordCount = 250; // todo: how many words are loaded, would be great if this was automatic 
  currentTheme = 'serika_dark';
  themeType = 'preset'; //preset, custom
  savedCustomThemes: CustomTheme[] = [];
  customTheme = new CustomTheme();
  favThemes: string[] = [];

  bookSort = 'recent' // recent, alphabetical
  recentBooks: string[] = [];
}

export class CustomTheme {
  name = 'custom';
  styles = {
    '--bg-color': '#323437',
    '--main-color': '#e2b714',
    '--caret-color': '#e2b714',
    '--sub-color': '#646669',
    '--sub-alt-color': '#2c2e31',
    '--text-color': '#d1d0c5',
    '--error-color': '#ca4754',
    '--error-extra-color': '#7e2a33',
    '--colorful-error-color': '#ca4754',
    '--colorful-error-extra-color': '#7e2a33'
  };
}
