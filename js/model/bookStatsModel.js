class BookStats { 
    constructor(bookName) {
        this.bookName = bookName;
        this.chapter = 0;
        this.typedPos = 0; // pos in chapter
        this.startedBook = false; // if you've started the book yet
        this.sessions = 0; // how many times you've started the book

        // Fix now! 

        /*
        instead of saving fulltext, save position (int letter) of chapter you are in. 
        this allows to both get previous words from the same chapter, and switching to the previous chapter and getting the end words.
        problem comes down to wpm/accuracy. when saving, save time typed, total words typed, and correct words typed
        should work for calculating.
        will have to rework loading and some typing.js stuff
        */

        // excludes backspace
        this.wpm = {
            timeTyping: 0, // in ms 
            correctChars: 0
        }

        // includes backspace
        this.accuracy = {
            typedChars: 0,
            correctChars: 0
        }
        
    }
}

exports.BookStats = BookStats;