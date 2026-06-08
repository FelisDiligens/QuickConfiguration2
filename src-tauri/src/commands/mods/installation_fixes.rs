use crate::commands::errors::CommandResult;
use crate::features::mods;
use crate::features::mods::installation::{DiagnosticIssue, DirEntry};
use crate::features::mods::models::json::ManagedMod;

#[tauri::command]
#[specta::specta]
#[function_name::named]
pub fn mods_uncheck_unneeded_entries(contents: Vec<DirEntry>) -> Vec<String> {
    log::trace!("Called command {}", function_name!());
    mods::installation::uncheck_unneeded_entries(contents)
}

#[tauri::command]
#[specta::specta]
#[function_name::named]
pub fn mods_detect_root_folder(mod_path: String) -> CommandResult<String> {
    log::trace!("Called command {}", function_name!());
    Ok(mods::installation::detect_root_folder(mod_path)?)
}

#[tauri::command]
#[specta::specta]
#[function_name::named]
pub fn mods_diagnose_issues(
    mod_details: ManagedMod,
    mod_path: String,
) -> CommandResult<Vec<DiagnosticIssue>> {
    log::trace!("Called command {}", function_name!());
    Ok(mods::installation::diagnose_issues(mod_details, mod_path)?)
}
