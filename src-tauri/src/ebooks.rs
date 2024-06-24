use std::{
    io::{self, Read, Seek, Write},
    path::PathBuf,
};

use epub::doc::{DocError, EpubDoc};
use mobi::{Mobi, MobiError};
use serde::{Deserialize, Serialize};
use tauri::{api::dialog, AppHandle};

use crate::{
    dirs,
    errors::Error,
    formatting::{format_text, parse_html},
};

// This should match the structure of the book JSON file, same in the frontend.

#[derive(Debug, Serialize, Deserialize)]
pub struct Metadata {
    pub book_name: String,
    pub title: String,
    pub author: Option<String>,
    pub date_written: Option<String>,
    pub num_chapters: usize,
    pub date_parsed: u64,
}

impl Metadata {
    pub fn new_from_txt(file_path: &PathBuf) -> Metadata {
        let book_name = file_path.file_stem().unwrap().to_str().unwrap().to_string();

        Metadata {
            book_name: book_name.clone(),
            title: book_name,
            author: None,
            date_written: None,
            num_chapters: 1,
            date_parsed: get_current_date(),
        }
    }

    pub fn new_from_epub<R: Read + Seek>(doc: &EpubDoc<R>, file_path: &PathBuf) -> Metadata {
        let book_name = file_path.file_stem().unwrap().to_str().unwrap().to_string();
        let title = doc.mdata("title").unwrap_or(book_name.clone());

        Metadata {
            book_name,
            title,
            author: doc.mdata("creator"),
            date_written: doc.mdata("date"),
            num_chapters: doc.spine.len(),
            date_parsed: get_current_date(),
        }
    }

    pub fn new_from_mobi(doc: &Mobi, file_path: &PathBuf) -> Metadata {
        let book_name = file_path.file_stem().unwrap().to_str().unwrap().to_string();

        Metadata {
            book_name,
            title: doc.title().to_string(),
            author: doc.author(),
            date_written: doc.publish_date(),
            num_chapters: 1,
            date_parsed: get_current_date(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Book {
    pub chapters: Vec<String>,
    pub metadata: Metadata,
}

impl Book {
    pub fn save(&self, library_dir: PathBuf) -> Result<(), io::Error> {
        let book_dir = library_dir.join(&self.metadata.title);
        std::fs::create_dir_all(&book_dir)?;

        let metadata_path = book_dir.join("metadata.json");

        println!("Saving metadata to {}", metadata_path.display());
        let mut file = std::fs::File::create(metadata_path)?;

        for (i, chapter_text) in self.chapters.iter().enumerate() {
            let chapter_path = book_dir.join(format!("chapter_{}.txt", i));
            println!("Saving chapter {} to {}", i, chapter_path.display());

            let mut file = std::fs::File::create(chapter_path)?;
            file.write_all(chapter_text.as_bytes())?;
        }

        serde_json::to_writer(&mut file, &self.metadata)?;
        Ok(())
    }

    pub fn load(book_name: &str, app_handler: &AppHandle) -> Result<Book, Error> {
        let library_dir = dirs::get_library_dir(app_handler)?;
        let book_dir = library_dir.join(book_name);
        let metadata_path = book_dir.join("metadata.json");

        if !metadata_path.exists() {
            return Err(Error::BookNotFound);
        }

        let metadata_file = std::fs::File::open(metadata_path)?;
        let metadata: Metadata = serde_json::from_reader(metadata_file)?;

        let mut chapters = Vec::new();

        for i in 0..metadata.num_chapters {
            let content = Book::load_chapter(&book_dir, i)?;
            chapters.push(content);
        }

        Ok(Book { chapters, metadata })
    }

    pub fn load_chapter(book_dir: &PathBuf, chapter_num: usize) -> Result<String, io::Error> {
        let chapter_path = book_dir.join(format!("chapter_{}.txt", chapter_num));

        let mut file = std::fs::File::open(chapter_path)?;
        let mut contents = String::new();
        file.read_to_string(&mut contents)?;

        Ok(contents)
    }
}

pub fn pick_ebook_file() -> Option<PathBuf> {
    // needs a channel because pick_file is non-blocking
    let (tx, rx) = std::sync::mpsc::channel();
    dialog::FileDialogBuilder::new()
        .set_title("Upload Book")
        .add_filter("eBooks", &["txt", "epub", "mobi"])
        .pick_file(move |path| {
            tx.send(path).expect("Failed to send file path");
        });

    rx.recv().unwrap()
}

fn get_current_date() -> u64 {
    let start = std::time::SystemTime::now();
    let since_the_epoch = start.duration_since(std::time::UNIX_EPOCH).unwrap();
    since_the_epoch.as_secs()
}

pub fn parse_txt(file_path: PathBuf) -> Result<Book, io::Error> {
    let metadata = Metadata::new_from_txt(&file_path);

    let mut file = std::fs::File::open(file_path)?;
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    contents = format_text(&contents);

    Ok(Book {
        chapters: vec![contents],
        metadata,
    })
}

pub fn parse_epub(file_path: PathBuf) -> Result<Book, DocError> {
    let mut doc = EpubDoc::new(&file_path)?;
    let metadata = Metadata::new_from_epub(&doc, &file_path);
    let mut chapters = Vec::new();

    for i in 0..metadata.num_chapters {
        let resource_id = doc.spine[i].to_string();
        let chapter_html = doc.get_resource_str(&resource_id).unwrap();
        let mut chapter_text = parse_html(&chapter_html.0);
        chapter_text = format_text(&chapter_text);
        chapters.push(chapter_text);
    }

    Ok(Book { chapters, metadata })
}

// todo: switch library or contribute to mobi-rs
pub fn parse_mobi(file_path: PathBuf) -> Result<Book, MobiError> {
    let doc = Mobi::from_path(&file_path)?;
    let metadata = Metadata::new_from_mobi(&doc, &file_path);

    let html = doc.content_as_string_lossy();
    let content = html;
    // let parsed_html = parse_html(&html);
    // let content = format_text(&parsed_html);
    println!("{:?}", content);
    println!("content exists");

    Ok(Book {
        chapters: vec![content],
        metadata,
    })
}

// todo: this should check if a book exists and is formatted correctly
pub fn book_exists(book_name: &str) -> bool {
    false
}
