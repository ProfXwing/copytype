// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{ffi::OsStr, io::Read};
use ebooks::{pick_ebook_file, Book};
use errors::{Error, Error::NoFileSelected};

mod ebooks;
mod formatting;
mod dirs;
mod errors;
mod tests;

#[tauri::command]
async fn upload_book(app_handler: tauri::AppHandle) -> Result<(), Error> {
    let file_path = pick_ebook_file();

    if file_path.is_none() {
        return Err(NoFileSelected);
    }

    let file_path = file_path.unwrap();
    let extension = file_path.extension().and_then(OsStr::to_str).unwrap();

    println!("extension: {}", extension);

    let book = match extension {
        "txt" => ebooks::parse_txt(file_path).ok(),
        "epub" => ebooks::parse_epub(file_path).ok(),
        // "mobi" => ebooks::parse_mobi(file_path).ok(), // todo : add mobi support 
        _ => None
    };

    if book.is_none() {
        return Err(Error::UnknownFileType);
    }

    let book = book.unwrap();

    let library_dir = dirs::get_library_dir(&app_handler).unwrap();

    println!("Saving book to {}", library_dir.display());
    book.save(library_dir)?;

    Ok(())
}

#[tauri::command]
async fn get_book(app_handler: tauri::AppHandle, book_name: String) -> Result<ebooks::Book, Error> {
    Book::load(&book_name, &app_handler)
}

#[tauri::command]
async fn get_book_list(app_handler: tauri::AppHandle) -> Result<Vec<ebooks::Metadata>, Error> {
    let library_dir = dirs::get_library_dir(&app_handler)?;

    let mut book_list = vec![];

    for entry in std::fs::read_dir(library_dir)? {
        let entry = entry?;
        let path = entry.path();

        if !path.is_dir() {
            continue;
        }

        let metadata_path = path.join("metadata.json");

        // if metadata doesn't exist, skip the book
        if !metadata_path.exists() {
            continue;
        }

        if metadata_path.exists() {
            let metadata_file = std::fs::File::open(metadata_path)?;
            let metadata: ebooks::Metadata = serde_json::from_reader(metadata_file)?;

            book_list.push(metadata);
        }
    }
    
    Ok(book_list)
}

#[tauri::command]
async fn get_settings(app_handler: tauri::AppHandle) -> Result<serde_json::Value, Error> {
    let settings_path = dirs::get_settings_path(&app_handler)?;

    let settings_file = std::fs::File::open(settings_path)?;
    let settings: serde_json::Value = serde_json::from_reader(settings_file)?;

    Ok(settings)
}

#[tauri::command]
async fn set_settings(app_handler: tauri::AppHandle, settings: serde_json::Value) -> Result<(), Error> {
    let settings_path = dirs::get_settings_path(&app_handler)?;

    let settings_file = std::fs::File::create(settings_path)?;
    serde_json::to_writer(settings_file, &settings)?;

    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![upload_book, get_book_list, get_settings, set_settings, get_book])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
