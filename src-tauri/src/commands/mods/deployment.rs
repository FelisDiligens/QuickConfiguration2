//! All commands that deploy mods.

use tap::TapFallible;
use tauri::async_runtime::spawn_blocking;
use tauri::{AppHandle, Emitter};

use crate::commands::errors::{CommandError, CommandResult};
use crate::commands::mods::ModsStateUpdate;
use crate::features::mods;
use crate::features::mods::deployment::MODS_DEPLOY_PROGRESS_EVENT;
use crate::features::mods::models::json::ManagedMods;
use crate::features::resourcelists::{ResourceList, get_legacy_mods_resources_path};
use crate::features::stores::settings::models::{
    ModCompareFiles, ModCopyMethod, ModManagerSettings,
};

/// Deploy all mods from the given `mods_path` into the given `game_path`.
/// Returns the updated mod store.
#[tauri::command]
#[specta::specta]
#[function_name::named]
pub async fn mods_deploy(
    mut mods: ManagedMods,
    mod_settings: ModManagerSettings,
    mods_path: String,
    game_path: String,
    mut list: ResourceList,
    app: AppHandle,
) -> CommandResult<(ModsStateUpdate, ResourceList)> {
    log::trace!("Called command {}", function_name!());

    let compare_files = match mod_settings.compare_files {
        ModCompareFiles::Auto => {
            !mods_path.starts_with(&game_path) || mod_settings.copy_method == ModCopyMethod::Copy
        }
        ModCompareFiles::Always => true,
        ModCompareFiles::Never => false,
    };

    let emit_app = app.clone();
    let result = spawn_blocking(move || {
        mods::deployment::deploy_mods(
            &mut mods,
            &mut list,
            &mods_path,
            &game_path,
            mods::deployment::DeployModsOptions {
                copy_method: mod_settings.copy_method.clone(),
                resource_insertion_position: mod_settings.resource_insertion_position.clone(),
                keep_config_files: mod_settings.keep_config_files,
                compare_files,
            },
            &|progress| {
                let _ = emit_app
                    .emit(MODS_DEPLOY_PROGRESS_EVENT, progress)
                    .tap_err(|e| log::error!("Couldn't send progress event: {e}"));
            },
        )
        .tap_err(|e| log::error!("Couldn't deploy mods: {e}"))?;

        // If mods were migrated from v1, also generate `managed.xml` and `resources.txt`, so users could potentially downgrade:
        if mods.migrated_from_v1.is_some() {
            let _ = mods::save_legacy_mods(&mods_path, &mods.clone().into()).tap_err(|err| {
                log::warn!("Couldn't save legacy managed.xml to path {mods_path:?}: {err}")
            });
            let _ = list
                .save_to_file(get_legacy_mods_resources_path(&mods_path))
                .tap_err(|err| {
                    log::warn!("Couldn't save legacy resources.txt to path {mods_path:?}: {err}")
                });
        }

        mods::save_mods(mods_path, &mods)
            .tap_err(|e| log::error!("Couldn't save mods metadata: {e}"))?;
        Ok((ModsStateUpdate::UpdatedAll(mods), list))
    })
    .await
    .tap_err(|e| log::error!("Couldn't join handle in {}: {e}", function_name!()))?
    .map_err(|e: anyhow::Error| CommandError::from(e))?;

    Ok(result)
}
