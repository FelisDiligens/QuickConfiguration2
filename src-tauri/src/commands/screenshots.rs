use std::path::Path;

use tap::TapFallible;
use tauri::async_runtime::spawn_blocking;

use crate::{
    commands::errors::{CommandError, CommandResult},
    features::screenshots::{self, Screenshot},
};

#[tauri::command]
#[specta::specta]
#[function_name::named]
pub async fn get_screenshots(
    game_path: Option<String>,
    ini_path: Option<String>,
) -> CommandResult<Vec<Screenshot>> {
    spawn_blocking(|| {
        screenshots::get_screenshots(
            game_path.map(|p| Path::new(&p).to_path_buf()),
            ini_path.map(|p| Path::new(&p).to_path_buf()),
        )
        .tap_err(|e| log::error!("Couldn't get screenshots: {e}"))
        .map_err(CommandError::from)
    })
    .await
    .tap_err(|e| log::error!("Couldn't join handle in {}: {}", function_name!(), e))
    .map_err(CommandError::from)
    .flatten()
}
