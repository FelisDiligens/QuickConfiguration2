//! All actions that deal with installing and importing mods.

use std::fs;
use std::path::Path;

use crate::features::mods;
use crate::features::mods::errors::{ModActionError, ModActionResult};
use crate::features::mods::models::json::{ManagedMod, ManagedMods, ModInstallationState};
use crate::features::sevenzip;
use crate::utils::fs_util;

mod fixes;
mod models;
pub use fixes::*;
pub use models::*;

#[cfg(test)]
pub mod tests;

impl ManagedMods {
    /// Installs the mod with the given details and the selected contents of the temporary folder.
    /// Deletes the temporary folder afterwards.
    /// Fails if the `mod_details.folder_path` already exists.
    pub fn install_from_temp_folder<P1: AsRef<Path>, P2: AsRef<Path>>(
        &mut self,
        mods_path: P1,
        r#mod: ManagedMod,
        selected_relative_paths: Vec<P2>,
    ) -> ModActionResult<(ManagedMod, ModInstallationResult)> {
        let existing_mod = self.get_mod(&r#mod.key);
        if let Some(existing_mod) = existing_mod {
            log::trace!(
                "Found existing mod with identical key {}, assuming reinstallation/update.",
                r#mod.key
            );
            if existing_mod.folder_name != r#mod.folder_name {
                log::error!("Folder names between new and old version of mod do not match");
                return Err(ModActionError::InvalidFolderName(
                    "Folder names between new and old version of mod do not match".to_string(),
                ));
            }
        }

        let folder_path = mods_path.as_ref().join(&r#mod.folder_name);
        if folder_path.exists() {
            if let Some(existing_mod) = existing_mod
                && existing_mod.folder_name == r#mod.folder_name
            {
                log::trace!("Folder {folder_path:?} already exists, deleting contents.");
                fs::remove_dir_all(&folder_path)?;
            } else {
                log::error!(
                    "Error in install_from_temp_folder: Folder {folder_path:?} already exists! Aborting",
                );
                return Err(ModActionError::FolderAlreadyExists(
                    folder_path.to_string_lossy().into_owned(),
                ));
            }
        }
        fs::create_dir(&folder_path)?;

        let tmp_path = mods::get_mods_temp_path(mods_path.as_ref());

        for relative_path in selected_relative_paths {
            let source_path = tmp_path.join(relative_path.as_ref()).canonicalize()?;
            let destination_path = folder_path.join(relative_path.as_ref());

            if let Some(destination_folder) = destination_path.parent() {
                log::trace!("Creating directories: {destination_folder:?}");
                fs::create_dir_all(destination_folder)?;
            }

            log::trace!("Moving {source_path:?} to {destination_path:?}.");
            fs_util::move_file(&source_path, &destination_path)?;
        }

        let updated;
        if existing_mod.is_some() && self.replace_mod(&r#mod.key, r#mod.clone()).is_some() {
            log::trace!("Replaced mod details by key {}", r#mod.key);
            updated = true;
        } else {
            self.mods.push(r#mod.clone());
            log::trace!("Added mod details with key {}", r#mod.key);
            updated = false;
        }

        if updated && let Some(state) = self.get_mod_state(&r#mod.key) {
            let mut state = state.clone();
            state.outdated = true;
            if self.replace_mod_state(&r#mod.key, state).is_some() {
                log::trace!("Updated mod installation state to flag it as outdated");
            }
        }

        delete_temp_folder(mods_path)?;
        Ok((
            r#mod,
            if updated {
                ModInstallationResult::Updated
            } else {
                ModInstallationResult::Added
            },
        ))
    }

    /// Installs the mod with the given details and the given archives from the Data folder.
    /// Assumes that the archives are already in the resource list and tracks the mod as deployed.
    /// This makes deploying the mod unnecessary and prevents ".ba2.old" files from being created when deploying.
    /// Fails if the `mod_details.folder_path` already exists. Fails if one of the archives doesn't exist.
    pub fn install_from_existing_archives<P1: AsRef<Path>, P2: AsRef<Path>, S: AsRef<str>>(
        &mut self,
        game_path: P1,
        mods_path: P2,
        mut r#mod: ManagedMod,
        archive_names: &[S],
    ) -> ModActionResult<()> {
        let game_data_path = game_path.as_ref().join("Data");
        let mods_path = mods_path.as_ref();
        let folder_path = mods_path.join(&r#mod.folder_name);

        if folder_path.exists() {
            log::error!(
                "Error in install_from_existing_archives: Folder {folder_path:?} already exists! Aborting",
            );
            return Err(ModActionError::FolderAlreadyExists(
                folder_path.to_string_lossy().into_owned(),
            ));
        }
        fs::create_dir(&folder_path)?;

        for archive_name in archive_names {
            let source_path = game_data_path.join(archive_name.as_ref()).canonicalize()?;
            let destination_path = folder_path.join(archive_name.as_ref());

            if let Some(destination_folder) = destination_path.parent() {
                log::trace!("Creating directories: {destination_folder:?}");
                fs::create_dir_all(destination_folder)?;
            }

            log::trace!("Copying {source_path:?} to {destination_path:?}.");
            fs::copy(&source_path, &destination_path)?;
        }

        r#mod.enabled = true;
        r#mod.options.root_folder = "Data".to_string();
        let state = ModInstallationState {
            key: r#mod.key.clone(),
            root_folder: r#mod.options.root_folder.clone(),
            files: archive_names
                .iter()
                .map(|s| s.as_ref().to_owned())
                .collect(),
            outdated: false,
        };
        self.mods.push(r#mod);
        self.state.push(state);

        Ok(())
    }
}

/// Copies file to temporary folder.
/// If the file is an archive, extracts it's contents to the temporary folder instead.
/// Returns folder contents.
pub fn create_temp_folder_from_file_or_archive<P: AsRef<Path>>(
    mods_path: P,
    file_path: P,
) -> ModActionResult<Vec<DirEntry>> {
    // Bail early if the file_path does not point to a file:
    if !file_path.as_ref().is_file() {
        return Err(ModActionError::NotAFile(
            file_path.as_ref().to_string_lossy().into_owned(),
        ));
    }

    if let Some(extension) = file_path
        .as_ref()
        .extension()
        .map(|ext| ext.to_string_lossy())
        && sevenzip::SUPPORTED_ARCHIVE_EXTENSIONS.contains(&extension.as_ref())
    {
        return create_temp_folder_from_archive(mods_path, file_path);
    }
    create_temp_folder_from_file_or_folder(mods_path, file_path)
}

/// Copies file or folder to temporary folder. Returns folder contents.
/// If a folder is copied, then it's copied to `_tmp/folder_name`.
/// If you wish to copy the contents of a folder, use `create_temp_folder_from_folder_contents`.
pub fn create_temp_folder_from_file_or_folder<P: AsRef<Path>>(
    mods_path: P,
    file_path: P,
) -> ModActionResult<Vec<DirEntry>> {
    create_temp_folder_from_files_or_folders(mods_path, &[file_path])
}

/// Copies files or folders to temporary folder. Returns folder contents.
pub fn create_temp_folder_from_files_or_folders<P1: AsRef<Path>, P2: AsRef<Path>>(
    mods_path: P1,
    file_paths: &[P2],
) -> ModActionResult<Vec<DirEntry>> {
    // Bail early if one of the file_paths does not exist:
    if let Some(file_path) = file_paths.iter().find(|p| !p.as_ref().exists()) {
        return Err(ModActionError::NotFound(
            file_path.as_ref().to_string_lossy().into_owned(),
        ));
    }

    let temp_path = mods::get_mods_temp_path(mods_path);

    // Create temporary directory once:
    if fs::exists(&temp_path)? {
        fs::remove_dir_all(&temp_path)?;
    }
    fs::create_dir_all(&temp_path)?;

    for file_path in file_paths {
        let file_path = file_path.as_ref();
        let file_name = file_path.file_name().ok_or(ModActionError::NoBasename(
            file_path.to_string_lossy().into_owned(),
        ))?;
        let destination_path = temp_path.join(file_name);

        // Copy the file (or folder):
        if file_path.is_file() {
            log::trace!("Copying file {file_path:?} to {destination_path:?}");
            fs::copy(file_path, &destination_path)?;
        } else if file_path.is_dir() {
            log::trace!("Copying folder {file_path:?} to {destination_path:?}");
            fs_util::copy_dir_all(file_path, &destination_path, fs_util::CopyMethod::Copy)?;
        }
    }

    // Returns folder contents:
    DirEntry::folder_contents(temp_path)
}

/// Extracts archive to temporary folder. Returns folder contents.
pub fn create_temp_folder_from_archive<P: AsRef<Path>>(
    mods_path: P,
    file_path: P,
) -> ModActionResult<Vec<DirEntry>> {
    // Bail early if the file_path does not point to a file:
    if !file_path.as_ref().is_file() {
        return Err(ModActionError::NotAFile(
            file_path.as_ref().to_string_lossy().into_owned(),
        ));
    }

    let temp_path = mods::get_mods_temp_path(mods_path);

    // Create temporary directory:
    if fs::exists(&temp_path)? {
        fs::remove_dir_all(&temp_path)?;
    }
    fs::create_dir_all(&temp_path)?;

    // Extract the archive:
    sevenzip::extract_archive(file_path.as_ref(), &temp_path)?;

    // Returns folder contents:
    DirEntry::folder_contents(temp_path)
}

/// Copies contents of folder to temporary folder. Returns folder contents.
pub fn create_temp_folder_from_folder_contents<P: AsRef<Path>>(
    mods_path: P,
    folder_path: P,
) -> ModActionResult<Vec<DirEntry>> {
    // Bail early if the folder_path does not point to a folder:
    if !folder_path.as_ref().is_dir() {
        return Err(ModActionError::NotAFolder(
            folder_path.as_ref().to_string_lossy().into_owned(),
        ));
    }

    let temp_path = mods::get_mods_temp_path(mods_path);

    // Create temporary directory:
    if fs::exists(&temp_path)? {
        fs::remove_dir_all(&temp_path)?;
    }
    fs::create_dir_all(&temp_path)?;

    // Copy the folder contents:
    fs_util::copy_dir_all(folder_path.as_ref(), &temp_path, fs_util::CopyMethod::Copy)?;

    // Returns folder contents:
    DirEntry::folder_contents(temp_path)
}

/// Deletes the temporary folder. If the folder doesn't exist, returns `Ok(())`.
pub fn delete_temp_folder<P: AsRef<Path>>(mods_path: P) -> ModActionResult<()> {
    let temp_path = mods::get_mods_temp_path(mods_path);
    if fs::exists(&temp_path)? {
        fs::remove_dir_all(&temp_path)?;
    }
    Ok(())
}
