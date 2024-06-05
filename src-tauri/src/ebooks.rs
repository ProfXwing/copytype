use std::{io::{self, Read, Seek, Write}, path::PathBuf};

use epub::doc::{DocError, EpubDoc};
use mobi::{Mobi, MobiError};
use serde::{Deserialize, Serialize};
use tauri::api::dialog;

use crate::formatting::{format_text, parse_html};

#[derive(Debug, Serialize, Deserialize)]
// title, author, date_written, chapter_paths, date started typing
struct MetaData {
    title: String,
    author: Option<String>,
    date_written: Option<String>,
    num_chapters: usize,
    date_parsed: String,
}

impl MetaData {
    pub fn new_from_txt(title: &str) -> MetaData {
        MetaData {
            title: title.to_string(),
            author: None,
            date_written: None,
            num_chapters: 1,
            date_parsed: get_current_date(),
        }
    }

    pub fn new_from_epub<R: Read + Seek>(file_path: PathBuf, doc: &EpubDoc<R>) -> MetaData {
        let file_name = file_path.file_stem().unwrap().to_str().unwrap();
        let title = doc.mdata("title").unwrap_or(file_name.to_string());

        MetaData {
            title,
            author: doc.mdata("creator"),
            date_written: doc.mdata("date"),
            num_chapters: doc.spine.len(),
            date_parsed: get_current_date(),
        }
    }

    pub fn new_from_mobi(doc: &Mobi) -> MetaData {
        MetaData {
            title: doc.title().to_string(),
            author: doc.author(),
            date_written: doc.publish_date(),
            num_chapters: 1,
            date_parsed: get_current_date(),
        }
    }
}

impl MetaData {
}

#[derive(Debug)]
pub struct Book {
    chapters: Vec<String>,
    metadata: MetaData
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


fn get_current_date() -> String {
    let start = std::time::SystemTime::now();
    let since_the_epoch = start.duration_since(std::time::UNIX_EPOCH).unwrap();
    since_the_epoch.as_secs().to_string()
}

fn generate_cover_html(title: &str) -> String {
    format!("<h1>{}</h1>", title)
}

pub fn parse_txt(file_path: PathBuf) -> Result<Book, io::Error> {
    let title = file_path.file_stem().unwrap().to_str().unwrap();
    let metadata = MetaData::new_from_txt(title);

    let mut file = std::fs::File::open(file_path)?;
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;

    Ok(Book {
        chapters: vec![contents],
        metadata,
    })
}

pub fn parse_epub(file_path: PathBuf) -> Result<Book, DocError> {
    let mut doc = EpubDoc::new(&file_path)?;
    let metadata = MetaData::new_from_epub(file_path, &doc);
    let mut chapters = Vec::new();

    for i in 0..metadata.num_chapters { 
        let resource_id = doc.spine[i].to_string();
        let chapter_html = doc.get_resource_str(&resource_id).unwrap();
        let mut chapter_text = parse_html(&chapter_html.0);
        chapter_text = format_text(&chapter_text);
        chapters.push(chapter_text);
    }

    Ok(Book {
        chapters,
        metadata
    })

}

// todo: switch library or contribute to mobi-rs
pub fn parse_mobi(file_path: PathBuf) -> Result<Book, MobiError> {
    let doc = Mobi::from_path(file_path)?;
    println!("doc exists");
    let metadata = MetaData::new_from_mobi(&doc);
    println!("{:?}", metadata);

    let html = doc.content_as_string_lossy();
    // let content = html;
    let parsed_html = parse_html(&html);
    let content = format_text(&parsed_html);
    println!("{:?}", content);
    println!("content exists");

    Ok(Book {
        chapters: vec![content],
        metadata
    })
}

// todo: this should check if a book exists and is formatted correctly
pub fn book_exists(book_name: &str) -> bool {
    false
}
