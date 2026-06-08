use tap::TapFallible;
use tauri::async_runtime::spawn_blocking;

use crate::commands::errors::{CommandError, CommandResult};
use crate::features::mods::models::json::{ManagedMod, ModInstallationState};
use crate::features::mods::utils::{self, Conflict, DeployedArchive};

#[tauri::command]
#[specta::specta]
#[function_name::named]
pub async fn mods_utils_pack_ba2_archives(
    mod_name: String,
    src_path: String,
    dst_path: String,
    tmp_path: String,
) -> CommandResult<()> {
    log::trace!("Called command {}", function_name!());
    spawn_blocking(move || {
        utils::pack_ba2_archives(mod_name, src_path, dst_path, tmp_path)
            .tap_err(|e| log::error!("Couldn't pack archives: {e}"))
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
pub async fn mods_utils_get_conflicting_files(
    mods_path: String,
    mods: Vec<ManagedMod>,
) -> CommandResult<Vec<Conflict>> {
    log::trace!("Called command {}", function_name!());
    spawn_blocking(move || {
        utils::get_conflicting_files(mods_path, &mods)
            .tap_err(|e| log::error!("Couldn't get conflicting files: {e}"))
            .map_err(CommandError::from)
    })
    .await
    .tap_err(|e| log::error!("Couldn't join handle in {}: {}", function_name!(), e))
    .map_err(CommandError::from)
    .flatten()
}

/// Returns all *.ba2 file names that are currently deployed by a mod.
/// If multiple mods deploy the same archive, only the last one (highest precedence) is kept.
#[tauri::command]
#[specta::specta]
#[function_name::named]
pub async fn mods_utils_get_deployed_archives(
    state: Vec<ModInstallationState>,
) -> CommandResult<Vec<DeployedArchive>> {
    log::trace!("Called command {}", function_name!());
    spawn_blocking(move || {
        utils::get_deployed_archives(&state)
            .tap_err(|e| log::error!("Couldn't get deployed archives: {e}"))
            .map_err(CommandError::from)
    })
    .await
    .tap_err(|e| log::error!("Couldn't join handle in {}: {}", function_name!(), e))
    .map_err(CommandError::from)
    .flatten()
}
