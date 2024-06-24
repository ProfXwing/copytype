use std::path::PathBuf;

pub fn get_library_dir(app_handle: &tauri::AppHandle) -> Result<PathBuf, std::io::Error> {
    let library_path = get_app_data_dir(app_handle)?.join("library");
    std::fs::create_dir_all(&library_path)?;
    Ok(
        library_path
    )
}

pub fn get_app_data_dir(app_handle: &tauri::AppHandle) -> Result<PathBuf, std::io::Error> {
    let app_data_dir = app_handle.path_resolver().app_data_dir().unwrap();
    std::fs::create_dir_all(&app_data_dir)?;
    Ok(
        app_data_dir
    )
}

pub fn get_settings_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, std::io::Error> {
    let settings_path = get_app_data_dir(app_handle)?.join("settings.json");
    Ok(
        settings_path
    )
}