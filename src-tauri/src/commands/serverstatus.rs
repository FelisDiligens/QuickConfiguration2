use tap::TapFallible;

use crate::commands::errors::{CommandError, CommandResult};
use crate::features::serverstatus::{LocalizedServerStatus, ServerStatusAPI};

#[tauri::command]
#[specta::specta]
pub async fn fetch_localized_server_status(
    language: String,
) -> CommandResult<LocalizedServerStatus> {
    ServerStatusAPI::new()
        .fetch_localized_server_status(&language)
        .await
        .tap_err(|err| log::error!("Failed to fetch localized server status: {err}"))
        .map_err(CommandError::from)
}
