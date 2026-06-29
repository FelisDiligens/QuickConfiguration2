use std::sync::Mutex;
use tap::TapFallible;
use tauri::async_runtime::spawn_blocking;

use crate::{
    commands::errors::{CommandError, CommandResult},
    features::stores::settings::{self, models::Settings},
};

static SAVE_SETTINGS_MUTEX: Mutex<()> = Mutex::new(());

#[tauri::command]
#[specta::specta]
#[function_name::named]
pub async fn get_settings() -> CommandResult<Settings> {
    spawn_blocking(|| {
        settings::get_settings_with_legacy_migration()
            .tap_err(|e| log::error!("Couldn't load settings: {e}"))
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
pub async fn save_settings(settings: Settings) -> CommandResult<()> {
    spawn_blocking(|| {
        let _guard = SAVE_SETTINGS_MUTEX.lock().unwrap_or_else(|e| {
            log::error!("Settings save mutex was poisoned, recovering");
            e.into_inner()
        });
        settings::save_settings(settings)
            .tap_err(|e| log::error!("Couldn't save settings: {e}"))
            .map_err(CommandError::from)
    })
    .await
    .tap_err(|e| log::error!("Couldn't join handle in {}: {}", function_name!(), e))
    .map_err(CommandError::from)
    .flatten()
}
