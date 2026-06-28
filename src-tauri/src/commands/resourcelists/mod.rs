use std::path::PathBuf;

use tauri::State;

use super::errors::CommandResult;
use crate::features::resourcelists::{ResourceList, get_legacy_mods_resources_path};
use crate::features::stores::ini::{IniFile, IniFiles};

#[tauri::command]
#[specta::specta]
#[function_name::named]
pub fn resourcelist_load_from_ini(
    ini_file: IniFile,
    section: Option<String>,
    key: String,
    state: State<'_, IniFiles>,
) -> CommandResult<ResourceList> {
    log::trace!("Called command {}", function_name!());
    let ini = state.get_file(ini_file).lock()?;
    Ok(ResourceList::load_from_ini(&ini, section, key))
}

#[tauri::command]
#[specta::specta]
#[function_name::named]
pub fn resourcelist_save_to_ini(
    resourcelist: ResourceList,
    ini_file: IniFile,
    section: Option<String>,
    key: String,
    state: State<'_, IniFiles>,
) -> CommandResult<()> {
    log::trace!("Called command {}", function_name!());
    let mut ini = state.get_file(ini_file).lock()?;
    resourcelist.save_to_ini(&mut ini, section.as_deref(), &key);
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn resourcelist_load_from_text_file(mods_path: PathBuf) -> CommandResult<ResourceList> {
    let resources_path = get_legacy_mods_resources_path(mods_path);
    Ok(ResourceList::load_from_file(resources_path)?)
}

#[tauri::command]
#[specta::specta]
pub fn resourcelist_save_to_text_file(
    resourcelist: ResourceList,
    mods_path: PathBuf,
) -> CommandResult<()> {
    let resources_path = get_legacy_mods_resources_path(mods_path);
    resourcelist.save_to_file(resources_path)?;
    Ok(())
}

/// Switches the ini keys around in the ini (comma-separated).
/// If the new key already exists, it merges the lists together.
/// Returns the new resource list.
#[tauri::command]
#[specta::specta]
#[function_name::named]
pub fn resourcelist_switch_ini_keys(
    mut resourcelist: ResourceList,
    ini_file: IniFile,
    section: Option<String>,
    old_key: String,
    new_key: String,
    state: State<'_, IniFiles>,
) -> CommandResult<ResourceList> {
    log::trace!("Called command {}", function_name!());
    let mut ini = state.get_file(ini_file).lock()?;
    resourcelist.switch_ini_keys(&mut ini, section.as_deref(), &old_key, &new_key);
    Ok(resourcelist)
}

/// Search `"${gamePath}/Data"` for archives that are not included in the resource list.
/// Excludes any archive starting with "SeventySix - " (as we don't want to add the game's archives).
/// Returns the list of archives.
#[tauri::command]
#[specta::specta]
pub fn resourcelist_get_unlisted_archives(
    resourcelist: ResourceList,
    game_path: PathBuf,
) -> CommandResult<Vec<String>> {
    let data_path = game_path.join("Data");
    Ok(resourcelist.get_unlisted_archives(data_path)?)
}

/// Search `"${gamePath}/Data"` for archives that are not included in the resource list and appends them to it.
/// Excludes any archive starting with "SeventySix - " (as we don't want to add the game's archives).
/// Returns the modified resource list.
#[tauri::command]
#[specta::specta]
pub fn resourcelist_add_unlisted_archives(
    mut resourcelist: ResourceList,
    game_path: PathBuf,
) -> CommandResult<ResourceList> {
    let data_path = game_path.join("Data");
    resourcelist.add_unlisted_archives(data_path)?;
    Ok(resourcelist)
}

/// Checks if all archives in the resource list exist in `"${gamePath}/Data"`.
/// If not, they will be discarded (removed from the list).
/// Returns the modified resource list.
#[tauri::command]
#[specta::specta]
pub fn resourcelist_remove_non_existant_archives(
    mut resourcelist: ResourceList,
    game_path: PathBuf,
) -> ResourceList {
    let data_path = game_path.join("Data");
    resourcelist.remove_non_existant_archives(data_path);
    resourcelist
}

/// Removes archives starting with "SeventySix -", as they belong to the game.
/// This could be used to cleanup the resource list when accidentally adding game archives.
/// Returns the modified resource list.
#[tauri::command]
#[specta::specta]
pub fn resourcelist_remove_game_archives(mut resourcelist: ResourceList) -> ResourceList {
    resourcelist.remove_game_archives();
    resourcelist
}
