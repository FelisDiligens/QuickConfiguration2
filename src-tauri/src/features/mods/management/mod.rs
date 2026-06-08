//! All actions that deal with the mods themselves. They change the state or the files of a mod, but don't affect game files.

use std::fs;
use std::path::Path;

use itertools::Itertools;

use crate::features::mods::errors::{ModActionError, ModActionResult};
use crate::features::mods::models::json::{ManagedMod, ManagedMods};
use crate::utils::fs_util::is_filename_valid;

impl ManagedMods {
    /// Deletes all files of the mod inside of `mods_path` and removes it from the list.
    pub fn uninstall<P: AsRef<Path>, S: AsRef<str>>(
        &mut self,
        mods_path: P,
        key: S,
    ) -> ModActionResult<()> {
        let Some((mod_index, r#mod)) = self
            .mods
            .iter()
            .find_position(|r#mod| r#mod.key == key.as_ref())
        else {
            return Err(ModActionError::ModNotFound(key.as_ref().to_string()));
        };
        if self.get_mod_state(&r#mod.key).is_some() {
            log::info!(
                "Removing a deployed mod does not currently remove it from the game folder."
            );
        }
        let mod_folder_path = mods_path.as_ref().join(&r#mod.folder_name);
        if fs::exists(&mod_folder_path)? {
            fs::remove_dir_all(&mod_folder_path)?;
        }
        self.mods.remove(mod_index);
        Ok(())
    }
}

impl ManagedMod {
    /// Rename the mod's folder inside of `mods_path`.
    /// Returns `Ok(true)` if the folder was renamed successfully,
    /// `Ok(false)` if no action was taken (because the folder names match).
    pub fn rename_folder<P: AsRef<Path>, S: AsRef<str>>(
        &mut self,
        mods_path: P,
        new_folder_name: S,
    ) -> ModActionResult<bool> {
        let new_folder_name_str = new_folder_name.as_ref();

        // Don't rename if folder name is equal:
        if self.folder_name == new_folder_name_str {
            return Ok(false);
        }

        // Check if folder name is invalid:
        if !is_filename_valid(new_folder_name_str) {
            return Err(ModActionError::InvalidFolderName(
                new_folder_name_str.to_string(),
            ));
        }

        let mods_path = mods_path.as_ref();
        let old_folder_path = mods_path.join(&self.folder_name);
        let new_folder_path = mods_path.join(new_folder_name_str);

        // Check if folder already exists:
        if new_folder_path.exists() {
            return Err(ModActionError::FolderAlreadyExists(
                new_folder_path.to_string_lossy().into_owned(),
            ));
        }

        // Try to rename folder:
        match fs::rename(&old_folder_path, &new_folder_path) {
            Ok(_) => {
                // Successful - update the folder name
                self.folder_name = new_folder_name_str.to_string();
                Ok(true)
            }
            Err(e) => {
                log::error!(
                    "Failed to rename folder from {:?} to {:?}: {}",
                    old_folder_path,
                    new_folder_path,
                    e
                );
                Err(ModActionError::from(e))
            }
        }
    }
}
