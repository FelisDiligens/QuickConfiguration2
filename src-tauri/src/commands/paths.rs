use std::{fs, path::Path};

use tap::TapOptional;

use crate::{
    commands::errors::{CommandError, CommandResult},
    features::game::paths::{game_config, game_installation},
    utils::{fs_util, paths},
};

#[tauri::command]
#[specta::specta]
pub fn is_file(path_str: &str) -> bool {
    Path::new(path_str).is_file()
}

#[tauri::command]
#[specta::specta]
pub fn is_directory(path_str: &str) -> bool {
    Path::new(path_str).is_dir()
}

/// Returns the file size in number of bytes formatted as string,
/// because the numbers might get too large for a `u32`.
#[tauri::command]
#[specta::specta]
pub fn get_file_size(path_str: &str) -> CommandResult<String> {
    Ok(fs::metadata(path_str)?.len().to_string())
}

/// "Strips" the `basePath` from the `path` and returns the relative path.
///
/// Example:
/// ```js
/// pathStripPrefix(
///     "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Fallout 76",
///     "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Fallout 76\\Data"
/// ) === "Data"
/// ```
#[tauri::command]
#[specta::specta]
pub fn path_strip_prefix(base_path: &str, path: &str) -> CommandResult<String> {
    Ok(fs_util::get_relative_path(base_path, path)?
        .to_str()
        .ok_or_else(|| CommandError::Utf8Error {
            message: path.to_string(),
        })?
        .to_string())
}

#[tauri::command]
#[specta::specta]
pub fn detect_ini_path(game_path: Option<String>) -> Option<String> {
    game_config::detect_ini_path(game_path)
        .tap_none(|| log::warn!("Couldn't get ini path, returning None"))
        .map(|p| p.to_string_lossy().to_string())
}

#[tauri::command]
#[specta::specta]
pub fn get_config_path() -> String {
    paths::get_config_path()
        .expect("couldn't get config path")
        .to_string_lossy()
        .to_string()
}

#[tauri::command]
#[specta::specta]
pub fn validate_game_path(path_str: &str) -> bool {
    game_installation::validate_game_path(Path::new(path_str))
}

#[tauri::command]
#[specta::specta]
pub fn detect_game_path() -> Vec<String> {
    game_installation::detect_game_path()
        .into_iter()
        .map(|path| path.to_string_lossy().to_string())
        .collect()
}

#[tauri::command]
#[specta::specta]
pub fn detect_ini_prefix(ini_path: Option<String>) -> String {
    game_config::detect_ini_prefix(ini_path.map(|p| Path::new(&p).to_path_buf())).to_string()
}
