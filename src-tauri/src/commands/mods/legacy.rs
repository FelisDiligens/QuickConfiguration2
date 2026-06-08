use std::sync::Arc;

use tap::TapFallible;
use tauri::async_runtime::spawn_blocking;
use tauri::{AppHandle, Emitter, State};

use crate::commands::errors::{CommandError, CommandResult};
use crate::features::mods::legacy;
use crate::features::mods::legacy::MODS_MIGRATION_PROGRESS_EVENT;
use crate::features::stores::ini::IniFiles;

/// Returns the state of the mods metadata migration (whether v1.9.0 or later version have been migrated).
#[tauri::command]
#[specta::specta]
#[function_name::named]
pub async fn mods_detect_migration_state(mods_path: String) -> legacy::MigrationState {
    log::trace!("Called command {}", function_name!());
    legacy::detect_migration_state(mods_path)
}

/// Migrates v1 managed.xml to v2 mods.json.
#[tauri::command]
#[specta::specta]
#[function_name::named]
pub async fn mods_migrate_legacy_managed_mods(
    game_path: String,
    mods_path: String,
    state: State<'_, IniFiles>,
    app: AppHandle,
) -> CommandResult<()> {
    log::trace!("Called command {}", function_name!());
    let custom = Arc::clone(&state.custom);
    let (tx, mut rx) = tokio::sync::mpsc::channel(10);
    let (result, _) = tokio::try_join!(
        spawn_blocking(move || {
            let mut custom_lock = custom
                .lock()
                .tap_err(|e| log::error!("Couldn't lock mutex for *Custom.ini: {e}"))?;
            legacy::migrate_legacy_managed_mods(game_path, mods_path, &mut custom_lock, Some(tx))
                .tap_err(|e| log::error!("Couldn't migrate legacy mods: {e}"))
                .map_err(CommandError::from)
        }),
        async move {
            while let Some(msg) = rx.recv().await {
                log::trace!("[{}] Event received: {:?}", function_name!(), msg);
                app.emit(MODS_MIGRATION_PROGRESS_EVENT, msg)
                    .tap_err(|e| log::error!("Couldn't send progress event: {e}"))?;
            }
            Ok(())
        }
    )
    .tap_err(|e| log::error!("Couldn't join handle in {}: {}", function_name!(), e))?;
    result
}

/// Delete mods from v1 managed.xml.
#[tauri::command]
#[specta::specta]
#[function_name::named]
pub async fn mods_remove_legacy_managed_mods(
    game_path: String,
    mods_path: String,
    state: State<'_, IniFiles>,
    app: AppHandle,
) -> CommandResult<()> {
    log::trace!("Called command {}", function_name!());
    let custom = Arc::clone(&state.custom);
    let (tx, mut rx) = tokio::sync::mpsc::channel(10);
    let (result, _) = tokio::try_join!(
        spawn_blocking(move || {
            let mut custom_lock = custom
                .lock()
                .tap_err(|e| log::error!("Couldn't lock mutex for *Custom.ini: {e}"))?;
            legacy::remove_legacy_managed_mods(game_path, mods_path, &mut custom_lock, Some(tx))
                .tap_err(|e| log::error!("Couldn't remove legacy mods: {e}"))
                .map_err(CommandError::from)
        }),
        async move {
            while let Some(msg) = rx.recv().await {
                log::trace!("[{}] Event received: {:?}", function_name!(), msg);
                app.emit(MODS_MIGRATION_PROGRESS_EVENT, msg)
                    .tap_err(|e| log::error!("Couldn't send progress event: {e}"))?;
            }
            Ok(())
        }
    )
    .tap_err(|e| log::error!("Couldn't join handle in {}: {}", function_name!(), e))?;
    result
}
