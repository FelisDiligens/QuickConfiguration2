use crate::commands::errors::{CommandError, CommandResult};
use crate::utils::fs_util;

#[tauri::command]
#[specta::specta]
pub fn is_filename_valid(filename: String) -> bool {
    fs_util::is_filename_valid(&filename)
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
