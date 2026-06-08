use std::path::Path;

use camino::Utf8PathBuf;
use serde::{Deserialize, Serialize};
use specta::Type;

use crate::utils::fs_util;

use crate::features::mods::models::json::ManagedMod;

#[derive(Debug, Serialize, Deserialize, Type)]
pub struct Conflict {
    /// ID (UUID) of the mod that overwrites files of the other mod.
    pub lower_mod_id: String,
    /// ID (UUID) of the mod that has files being overwritten by the other mod.
    pub upper_mod_id: String,
    /// Relative paths of all files being overwritten.
    pub files: Vec<String>,
}

/// Checks if enabled mods "lower" on the list (= higher index) overwrite files of enabled mods "higher" on the list (= lower index).
pub fn get_conflicting_files<P: AsRef<Path>>(
    mods_path: P,
    mods: &[ManagedMod],
) -> anyhow::Result<Vec<Conflict>> {
    let enabled_mods: Vec<&ManagedMod> = mods.iter().filter(|m| m.enabled).collect();

    let mut conflicts: Vec<Conflict> = Vec::new();

    for (upper_idx, upper_mod) in enabled_mods.iter().enumerate() {
        let upper_mod_id = &upper_mod.key;
        let upper_mod_folder = mods_path.as_ref().join(&upper_mod.folder_name);
        let upper_root = &upper_mod.options.root_folder;

        let upper_files = get_relative_files(&upper_mod_folder, upper_root)?;

        for lower_mod in enabled_mods.iter().skip(upper_idx + 1) {
            let lower_mod_id = &lower_mod.key;
            let lower_mod_folder = mods_path.as_ref().join(&lower_mod.folder_name);
            let lower_root = &lower_mod.options.root_folder;

            let lower_files = get_relative_files(&lower_mod_folder, lower_root)?;

            let conflicting_files: Vec<String> = upper_files
                .iter()
                .filter(|file| lower_files.contains(file))
                .cloned()
                .collect();

            if !conflicting_files.is_empty() {
                conflicts.push(Conflict {
                    lower_mod_id: lower_mod_id.clone(),
                    upper_mod_id: upper_mod_id.clone(),
                    files: conflicting_files,
                });
            }
        }
    }

    Ok(conflicts)
}

/// Returns all file paths inside a folder, prepended with the root folder path.
fn get_relative_files(folder: &Path, root: &str) -> anyhow::Result<Vec<String>> {
    let mut files = Vec::new();

    if !folder.exists() {
        return Ok(files);
    }

    let root_path = Utf8PathBuf::from(root);

    for file_path in fs_util::list_files_recursively(folder, i32::MAX)? {
        let relative = fs_util::get_relative_path(folder, &file_path)?;
        let relative_path = Utf8PathBuf::try_from(relative)?;
        let path = if root.is_empty() || root == "." || root == "./" || root == ".\\" {
            relative_path
        } else {
            root_path.join(relative_path)
        };
        files.push(path.to_string());
    }

    Ok(files)
}
