use tap::TapFallible;
use tokio::task::spawn_blocking;

use crate::commands::errors::{CommandError, CommandResult};
use crate::features::archive2;
use crate::features::archive2::models::{Archive2Compression, Archive2Format, Archive2Info};

#[tauri::command]
#[specta::specta]
pub fn archive2_open_program() -> CommandResult<()> {
    archive2::open_archive2()?;
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn archive2_explore_archive(path: String) -> CommandResult<()> {
    archive2::explore_archive2(path)?;
    Ok(())
}

#[tauri::command]
#[specta::specta]
#[function_name::named]
pub async fn archive2_extract_archive(
    archive_path: String,
    output_folder_path: String,
) -> CommandResult<()> {
    log::trace!("Called command {}", function_name!());
    spawn_blocking(move || {
        archive2::extract_archive2(archive_path, output_folder_path).map_err(CommandError::from)
    })
    .await
    .tap_err(|e| log::error!("Couldn't join handle in {}: {}", function_name!(), e))
    .map_err(CommandError::from)
    .flatten()
}

#[tauri::command]
#[specta::specta]
#[function_name::named]
pub async fn archive2_create_archive(
    archive_path: String,
    source_folder_path: String,
    format: Archive2Format,
    compression: Archive2Compression,
) -> CommandResult<()> {
    log::trace!("Called command {}", function_name!());
    spawn_blocking(move || {
        archive2::create_archive2(archive_path, source_folder_path, format, compression)
            .map_err(CommandError::from)
    })
    .await
    .tap_err(|e| log::error!("Couldn't join handle in {}: {}", function_name!(), e))
    .map_err(CommandError::from)
    .flatten()
}

#[tauri::command]
#[specta::specta]
#[function_name::named]
pub async fn archive2_read_archive(path: String) -> CommandResult<Archive2Info> {
    log::trace!("Called command {}", function_name!());
    spawn_blocking(move || archive2::read_archive2(path).map_err(CommandError::from))
        .await
        .tap_err(|e| log::error!("Couldn't join handle in {}: {}", function_name!(), e))
        .map_err(CommandError::from)
        .flatten()
}
