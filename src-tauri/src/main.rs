// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::ffi::OsStr;
use ebooks::pick_ebook_file;
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

    let book = match extension {
        "txt" => ebooks::parse_txt(file_path).ok(),
        "epub" => ebooks::parse_epub(file_path).ok(),
        _ => None
    }.unwrap();

    let library_dir = dirs::get_library_dir(app_handler);

    println!("Saving book to {}", library_dir.display());
    book.save(library_dir)?;

    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![upload_book])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
