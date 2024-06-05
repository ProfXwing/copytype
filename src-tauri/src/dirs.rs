use std::path::PathBuf;

pub fn get_library_dir(app_handle: tauri::AppHandle) -> PathBuf {
    let library_path = app_handle.path_resolver().app_data_dir().unwrap().join("library");
    std::fs::create_dir_all(&library_path);
    library_path
}