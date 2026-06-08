use tap::TapFallible;
use tauri::async_runtime::spawn_blocking;

use crate::{
    commands::errors::{CommandError, CommandResult, SerializableCommandResult},
    features::translations::{self, Translation, TranslationMeta},
};

#[tauri::command]
#[specta::specta]
#[function_name::named]
pub async fn get_translations() -> CommandResult<Vec<String>> {
    log::trace!("Called command {}", function_name!());
    spawn_blocking(|| {
        translations::get_translation_keys()
            .tap_err(|e| log::error!("Couldn't list translations in folder: {e}"))
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
pub async fn save_translation(file_name: String, translation: Translation) -> CommandResult<()> {
    log::trace!("Called command {}", function_name!());
    spawn_blocking(move || {
        translations::save_translation(&file_name, translation)
            .tap_err(|e| log::error!("Couldn't save translation to {file_name}: {e}"))
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
pub async fn load_translation(key: String) -> CommandResult<Translation> {
    log::trace!("Called command {}", function_name!());
    spawn_blocking(move || {
        translations::load_translation(&key)
            .tap_err(|e| log::error!("Couldn't load translation for {key}: {e}"))
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
pub async fn load_all_translations() -> CommandResult<Vec<SerializableCommandResult<Translation>>> {
    log::trace!("Called command {}", function_name!());
    spawn_blocking(|| {
        translations::load_all_translations()
            .tap_err(|e| log::error!("Couldn't load translations: {e}"))
            .map(|v| v.into_iter().map(SerializableCommandResult::from).collect())
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
pub async fn load_translation_metadata(key: String) -> CommandResult<TranslationMeta> {
    log::trace!("Called command {}", function_name!());
    spawn_blocking(|| {
        translations::load_translation_metadata(key)
            .tap_err(|e| log::error!("Couldn't load translation metadata: {e}"))
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
pub async fn load_all_translation_metadata()
-> CommandResult<Vec<SerializableCommandResult<TranslationMeta>>> {
    log::trace!("Called command {}", function_name!());
    spawn_blocking(|| {
        translations::load_all_translation_metadata()
            .tap_err(|e| log::error!("Couldn't load translations: {e}"))
            .map(|v| v.into_iter().map(SerializableCommandResult::from).collect())
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
pub async fn check_for_translation_updates(last_updated: Option<String>) -> CommandResult<bool> {
    log::trace!("Called command {}", function_name!());
    translations::check_for_updates(
        last_updated
            .and_then(|dt| chrono::DateTime::parse_from_rfc3339(&dt).ok())
            .map(|dt| dt.with_timezone(&chrono::Utc)),
    )
    .await
    .tap_err(|e| log::error!("Couldn't check for translation updates: {e}"))
    .map_err(CommandError::from)
}

#[tauri::command]
#[specta::specta]
#[function_name::named]
pub async fn download_translations() -> CommandResult<Vec<String>> {
    log::trace!("Called command {}", function_name!());
    translations::download_translations()
        .await
        .tap_err(|e| log::error!("Couldn't download translations: {e}"))
        .map_err(CommandError::from)
}
