//! All commands that deal with installing mods.

use tap::TapFallible;
use tauri::async_runtime::spawn_blocking;

use crate::commands::errors::{CommandError, CommandResult};
use crate::commands::mods::ModsStateUpdate;
use crate::features::mods;
use crate::features::mods::errors::ModActionResult;
use crate::features::mods::installation::DirEntry;
use crate::features::mods::models::json::{ManagedMod, ManagedMods};
use crate::utils::fs_util;

/// Copies files or folders to temporary folder. Returns folder contents.
#[tauri::command]
#[specta::specta]
#[function_name::named]
pub async fn mods_create_temp_folder_from_files_or_folders(
    mods_path: String,
    file_paths: Vec<String>,
) -> CommandResult<Vec<DirEntry>> {
    log::trace!("Called command {}", function_name!());
    spawn_blocking(move || {
        mods::installation::create_temp_folder_from_files_or_folders(&mods_path, &file_paths)
            .tap_err(|err| {
                log::error!(
                    "Couldn't create _tmp folder in {:?} from file {:?}: {}",
                    mods_path,
                    file_paths,
                    err
                )
            })
            .map_err(CommandError::from)
    })
    .await
    .tap_err(|e| log::error!("Couldn't join handle in {}: {}", function_name!(), e))
    .map_err(CommandError::from)
    .flatten()
}

/// Copies file to temporary folder.
/// If the file is an archive, extracts it's contents to the temporary folder instead.
/// Returns folder contents.
#[tauri::command]
#[specta::specta]
#[function_name::named]
pub async fn mods_create_temp_folder_from_file_or_archive(
    mods_path: String,
    file_path: String,
) -> CommandResult<Vec<DirEntry>> {
    log::trace!("Called command {}", function_name!());
    spawn_blocking(move || {
        mods::installation::create_temp_folder_from_file_or_archive(&mods_path, &file_path)
            .tap_err(|err| {
                log::error!(
                    "Couldn't create _tmp folder in {:?} from file {:?}: {}",
                    mods_path,
                    file_path,
                    err
                )
            })
            .map_err(CommandError::from)
    })
    .await
    .tap_err(|e| log::error!("Couldn't join handle in {}: {}", function_name!(), e))
    .map_err(CommandError::from)
    .flatten()
}

/// Copies contents of folder to temporary folder. Returns folder contents.
#[tauri::command]
#[specta::specta]
#[function_name::named]
pub async fn mods_create_temp_folder_from_folder_contents(
    mods_path: String,
    folder_path: String,
) -> CommandResult<Vec<DirEntry>> {
    log::trace!("Called command {}", function_name!());
    spawn_blocking(move || {
        mods::installation::create_temp_folder_from_folder_contents(&mods_path, &folder_path)
            .tap_err(|err| {
                log::error!(
                    "Couldn't create _tmp folder in {:?} from folder {:?}: {}",
                    mods_path,
                    folder_path,
                    err
                )
            })
            .map_err(CommandError::from)
    })
    .await
    .tap_err(|e| log::error!("Couldn't join handle in {}: {}", function_name!(), e))
    .map_err(CommandError::from)
    .flatten()
}

/// Deletes the temporary folder. If the folder doesn't exist, returns `Ok(())`.
#[tauri::command]
#[specta::specta]
#[function_name::named]
pub async fn mods_delete_temp_folder(mods_path: String) -> CommandResult<()> {
    log::trace!("Called command {}", function_name!());
    spawn_blocking(move || {
        mods::installation::delete_temp_folder(&mods_path)
            .tap_err(|err| log::error!("Couldn't delete _tmp folder in {:?}: {}", mods_path, err))
            .map_err(CommandError::from)
    })
    .await
    .tap_err(|e| log::error!("Couldn't join handle in {}: {}", function_name!(), e))
    .map_err(CommandError::from)
    .flatten()
}

/// Installs the mod with the given details and the selected contents of the temporary folder.
/// Deletes the temporary folder afterwards.
/// Fails if the `mod_details.folder_path` already exists.
/// Returns the new mod that should be appended to the mods store.
#[tauri::command]
#[specta::specta]
#[function_name::named]
pub async fn mods_install_from_temp_folder(
    mut mods: ManagedMods,
    mods_path: String,
    mod_details: ManagedMod,
    selected_relative_paths: Vec<String>,
) -> CommandResult<ModsStateUpdate> {
    log::trace!("Called command {}", function_name!());
    spawn_blocking(move || {
        let mod_details = mods
            .install_from_temp_folder(&mods_path, mod_details, selected_relative_paths)
            .tap_err(|e| log::error!("Couldn't install mod from temp folder: {e}"))?;

        // If mods were migrated from v1, also generate a `managed.xml`, so users could potentially downgrade:
        if mods.migrated_from_v1.is_some() {
            let _ = mods::save_legacy_mods(&mods_path, &mods.clone().into()).tap_err(|err| {
                log::warn!("Couldn't save legacy managed.xml to path {mods_path:?}: {err}")
            });
        }

        mods::save_mods(mods_path, &mods)
            .tap_err(|e| log::error!("Couldn't save mods metadata: {e}"))?;
        Ok(ModsStateUpdate::AppendedMod(mod_details))
    })
    .await
    .tap_err(|e| log::error!("Couldn't join handle in {}: {}", function_name!(), e))
    .map_err(CommandError::from)
    .flatten()
}

/// Installs the mod with the given details and the given archives from the Data folder.
/// Assumes that the archives are already in the resource list and tracks the mod as deployed.
/// This makes deploying the mod unnecessary and prevents ".ba2.old" files from being created when deploying.
/// Returns the updated state that should be written to the mods store.
#[tauri::command]
#[specta::specta]
#[function_name::named]
pub async fn mods_install_from_existing_archives(
    mut mods: ManagedMods,
    game_path: String,
    mods_path: String,
    r#mod: ManagedMod,
    archive_names: Vec<String>,
) -> CommandResult<ModsStateUpdate> {
    log::trace!("Called command {}", function_name!());
    spawn_blocking(move || {
        mods.install_from_existing_archives(&game_path, &mods_path, r#mod, &archive_names)
            .tap_err(|e| log::error!("Couldn't install mod from temp folder: {e}"))?;

        // If mods were migrated from v1, also generate a `managed.xml`, so users could potentially downgrade:
        if mods.migrated_from_v1.is_some() {
            let _ = mods::save_legacy_mods(&mods_path, &mods.clone().into()).tap_err(|err| {
                log::warn!("Couldn't save legacy managed.xml to path {mods_path:?}: {err}")
            });
        }

        mods::save_mods(mods_path, &mods)
            .tap_err(|e| log::error!("Couldn't save mods metadata: {e}"))?;
        Ok(ModsStateUpdate::UpdatedAll(mods))
    })
    .await
    .tap_err(|e| log::error!("Couldn't join handle in {}: {}", function_name!(), e))
    .map_err(CommandError::from)
    .flatten()
}

#[tauri::command]
#[specta::specta]
#[function_name::named]
pub async fn mods_list_temp_folder_contents(mods_path: String) -> CommandResult<Vec<DirEntry>> {
    log::trace!("Called command {}", function_name!());
    let temp_path = mods::get_mods_temp_path(mods_path);
    if !temp_path.exists() {
        return Ok(Vec::new());
    }
    Ok(fs_util::list_entries(temp_path)?
        .map(DirEntry::try_from)
        .collect::<ModActionResult<Vec<_>>>()?)
}
