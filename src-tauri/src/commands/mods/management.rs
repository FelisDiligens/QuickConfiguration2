//! All commands that deal with the mods themselves.

use tap::TapFallible;
use tauri::async_runtime::spawn_blocking;

use crate::commands::errors::{CommandError, CommandResult};
use crate::commands::mods::ModsStateUpdate;
use crate::features::mods;
use crate::features::mods::models::json::ManagedMods;

/// Renames a mod's folder inside of `mods_path`.
/// Returns `Some` with the updated mod if the folder was renamed successfully,
/// `None` if no action was taken.
#[tauri::command]
#[specta::specta]
#[function_name::named]
pub async fn mods_rename_mod_folder(
    mut mods: ManagedMods,
    mods_path: String,
    mod_key: String,
    new_folder_name: String,
) -> CommandResult<Option<ModsStateUpdate>> {
    log::trace!("Called command {}", function_name!());
    spawn_blocking(move || {
        // Find the mod by key
        let Some(r#mod) = mods.mods.iter_mut().find(|m| m.key == mod_key) else {
            log::error!("Couldn't find mod with key {}", mod_key);
            return Err(crate::commands::errors::CommandError::String {
                message: format!("Couldn't find mod with key {}", mod_key),
            });
        };

        // Rename the mod folder
        let result = r#mod
            .rename_folder(&mods_path, &new_folder_name)
            .tap_err(|e| log::error!("Couldn't rename mod folder: {e}"))?;

        if result {
            let r#mod = r#mod.clone();

            // If mods were migrated from v1, also generate a `managed.xml`, so users could potentially downgrade:
            if mods.migrated_from_v1.is_some() {
                let _ = mods::save_legacy_mods(&mods_path, &mods.clone().into()).tap_err(|err| {
                    log::warn!("Couldn't save legacy managed.xml to path {mods_path:?}: {err}")
                });
            }

            // Save the updated mods metadata
            mods::save_mods(&mods_path, &mods)
                .tap_err(|e| log::error!("Couldn't save mods metadata: {e}"))?;

            Ok(Some(ModsStateUpdate::UpdatedMod(r#mod)))
        } else {
            Ok(None)
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
pub async fn mods_uninstall_mod(
    mut mods: ManagedMods,
    mods_path: String,
    mod_key: String,
) -> CommandResult<ModsStateUpdate> {
    log::trace!("Called command {}", function_name!());
    spawn_blocking(move || {
        mods.uninstall(&mods_path, &mod_key)
            .tap_err(|e| log::error!("Couldn't delete mod with key {mod_key}: {e}"))?;
        mods::save_mods(mods_path, &mods)
            .tap_err(|e| log::error!("Couldn't save mods metadata: {e}"))?;
        Ok(ModsStateUpdate::DeletedMod(mod_key))
    })
    .await
    .tap_err(|e| log::error!("Couldn't join handle in {}: {}", function_name!(), e))
    .map_err(CommandError::from)
    .flatten()
}
