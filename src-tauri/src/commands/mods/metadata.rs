//! All commands that load or save mod metadata.

use tap::TapFallible;
use tauri::async_runtime::spawn_blocking;

use crate::commands::errors::{CommandError, CommandResult};
use crate::features::mods;
use crate::features::mods::models::json::ManagedMods;

#[tauri::command]
#[specta::specta]
#[function_name::named]
pub async fn mods_load_metadata(mods_path: String) -> CommandResult<Option<ManagedMods>> {
    log::trace!("Called command {}", function_name!());
    spawn_blocking(move || {
        mods::load_mods(&mods_path)
            .tap_err(|err| {
                log::error!("Couldn't load mods.json from path {:?}: {}", mods_path, err)
            })
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
pub async fn mods_load_metadata_or_default(mods_path: String) -> CommandResult<ManagedMods> {
    log::trace!("Called command {}", function_name!());
    spawn_blocking(move || match mods::load_mods(&mods_path) {
        Ok(Some(mods)) => Ok(mods),
        Ok(None) => Ok(ManagedMods::default()),
        Err(err) => {
            log::error!("Couldn't load mods.json from path {:?}: {}", mods_path, err);
            Err(CommandError::from(err))
        }
    })
    .await
    .tap_err(|e| log::error!("Couldn't join handle in {}: {}", function_name!(), e))
    .map_err(CommandError::from)
    .flatten()
}

#[tauri::command]
#[specta::specta]
#[function_name::named]
pub async fn mods_save_metadata(mods_path: String, mods: ManagedMods) -> CommandResult<()> {
    log::trace!("Called command {}", function_name!());
    spawn_blocking(move || {
        // If mods were migrated from v1, also generate a `managed.xml`, so users could potentially downgrade:
        if mods.migrated_from_v1.is_some() {
            let _ = mods::save_legacy_mods(&mods_path, &mods.clone().into()).tap_err(|err| {
                log::warn!("Couldn't save legacy managed.xml to path {mods_path:?}: {err}")
            });
        }

        mods::save_mods(&mods_path, &mods)
            .tap_err(|err| log::error!("Couldn't save mods.json to path {:?}: {}", mods_path, err))
            .map_err(CommandError::from)
    })
    .await
    .tap_err(|e| log::error!("Couldn't join handle in {}: {}", function_name!(), e))
    .map_err(CommandError::from)
    .flatten()
}
