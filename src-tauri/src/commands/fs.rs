use std::fs;

use tap::TapFallible;

use crate::commands::errors::{CommandError, CommandResult};
use crate::utils::fs_util;

#[tauri::command]
#[specta::specta]
pub fn remove_file(path: String) -> CommandResult<()> {
    fs::remove_file(&path)
        .tap_err(|err| log::error!("Couldn't remove file `{path}`: {err}"))
        .map_err(CommandError::from)
}

#[tauri::command]
#[specta::specta]
pub fn is_filename_valid(filename: String) -> bool {
    fs_util::is_filename_valid(&filename)
}

#[tauri::command]
#[specta::specta]
pub fn is_path_valid(path: String) -> bool {
    fs_util::is_path_valid(&path)
}

#[tauri::command]
#[specta::specta]
pub fn sanitize_filename(filename: String, replacement: String) -> CommandResult<String> {
    if let Some(replacement) = replacement.chars().next() {
        Ok(fs_util::sanitize_filename(&filename, replacement))
    } else {
        Err(CommandError::String {
            message: format!("sanitize_filename: Expected char, got string: {replacement:?}"),
        })
    }
}
