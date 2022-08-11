export class BookStats {
  constructor(bookName = "") {
    this.bookName = bookName;
  }

  bookName: string;
  chapter = 0;
  typedPos = 0; // pos in chapter
  startedBook = false; // if you've started the book yet
  finishedBook = false;
  sessions = 0; // how many times you've started the book

  // excludes backspace
  wpm: WpmModel = {
    timeTyping: 0, // in ms 
    correctChars: 0
  }

  // includes backspace
  accuracy: AccuracyModel = {
    typedChars: 0,
    correctChars: 0
  }

  saved: SavedModel = {
    wpm: {
      timeTyping: 0,
      correctChars: 0
    },
    accuracy: {
      typedChars: 0,
      correctChars: 0
    }
  }
}

interface WpmModel {
  timeTyping: number;
  correctChars: number;
}

interface AccuracyModel {
  typedChars: number;
  correctChars: number;
}

interface SavedModel {
  wpm: WpmModel;
  accuracy: AccuracyModel;
}