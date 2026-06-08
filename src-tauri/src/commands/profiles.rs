use tap::TapFallible;
use tauri::async_runtime::spawn_blocking;

use crate::{
    commands::errors::{CommandError, CommandResult},
    features::stores::profiles::{self, models::json::Profiles},
};

#[tauri::command]
#[specta::specta]
#[function_name::named]
pub async fn get_profiles() -> CommandResult<Profiles> {
    spawn_blocking(|| {
        profiles::get_profiles_with_legacy_migration()
            .tap_err(|e| log::error!("Couldn't load profiles: {e}"))
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
pub async fn save_profiles(profiles: Profiles) -> CommandResult<()> {
    spawn_blocking(|| {
        profiles::save_profiles(profiles)
            .tap_err(|e| log::error!("Couldn't save profiles: {e}"))
            .map_err(CommandError::from)
    })
    .await
    .tap_err(|e| log::error!("Couldn't join handle in {}: {}", function_name!(), e))
    .map_err(CommandError::from)
    .flatten()
}
