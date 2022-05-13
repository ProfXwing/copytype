class BookStats { 
    constructor(bookName) {
        this.bookName = bookName;
        this.chapter = 0;
        this.typedPos = 0; // pos in chapter
        this.startedBook = false; // if you've started the book yet
        this.sessions = 0; // how many times you've started the book

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