use std::path::PathBuf;

pub fn get_library_dir(app_handle: &tauri::AppHandle) -> Result<PathBuf, std::io::Error> {
    let library_path = get_app_data_dir(app_handle).join("library");
    std::fs::create_dir_all(&library_path)?;
    Ok(
        library_path
    )
}

pub fn get_app_data_dir(app_handle: &tauri::AppHandle) -> PathBuf {
    app_handle.path_resolver().app_data_dir().unwrap()
}