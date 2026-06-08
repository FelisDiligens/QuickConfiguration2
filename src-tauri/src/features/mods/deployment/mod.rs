//! All actions that deploy or remove mods: add, remove, or change game files.

#[cfg(test)]
pub mod tests;

use std::path::{self, Path, PathBuf};
use std::{fs, io, thread};

use clone_macro::clone;
use itertools::Itertools;
use normalize_path::NormalizePath;
use tap::TapFallible;

use crate::features::mods::errors::{ModActionError, ModActionResult};
use crate::features::mods::models::json::{ManagedMod, ManagedMods, ModInstallationState};
use crate::features::resourcelists::ResourceList;
use crate::features::stores::settings::models::{ModCopyMethod, ResourceInsertionPosition};
use crate::utils::channel;
use crate::utils::fs_util;

mod models;
pub use models::*;

pub const CONFIG_FILE_EXTENSIONS: &[&str] = &[
    "ini", "json", "jsonc", "yaml", "yml", "xml", "toml", "conf", "cfg",
];

#[function_name::named]
pub fn deploy_mods<P: AsRef<Path>>(
    managed: &mut ManagedMods,
    list: &mut ResourceList,
    mods_path: P,
    game_path: P,
    copy_method: ModCopyMethod,
    resource_insertion_position: ResourceInsertionPosition,
    keep_config_files: bool,
    tx: Option<tokio::sync::mpsc::Sender<ModsDeployProgress>>,
) -> ModActionResult<()> {
    let global_enabled = managed.enabled;
    let mods_path = mods_path.as_ref();
    let game_path = game_path.as_ref();
    let enabled_mod_count = managed.mods.iter().filter(|m| m.enabled).count();

    log::info!(
        "[{}] Deploying {} mods from {:?} to {:?} (global enabled: {}, copy method: {:?})",
        function_name!(),
        enabled_mod_count,
        mods_path,
        game_path,
        global_enabled,
        copy_method
    );
    let _ = channel::blocking_send_opt(&tx, function_name!(), ModsDeployProgress::Preparing);

    // Check all enabled mods for invalid paths:
    for r#mod in managed.mods.iter() {
        if !r#mod.enabled {
            continue;
        }
        r#mod.folder_path(mods_path)?;
        r#mod.destination_path(game_path)?;
    }

    // Removing all mods prior to deployment:
    let (remove_tx, mut remove_rx) = tokio::sync::mpsc::channel(10);
    let handle = thread::spawn(clone!([tx], move || {
        while let Some(progress) = remove_rx.blocking_recv() {
            let _ = channel::blocking_send_opt(
                &tx,
                function_name!(),
                ModsDeployProgress::Removing { progress },
            );
        }
    }));

    remove_mods(managed, list, game_path, keep_config_files, Some(remove_tx))?;

    let _ = handle.join().tap_err(|e| {
        log::error!(
            "[{}] Couldn't join receiver thread: {:?}",
            function_name!(),
            e
        )
    });

    // Deploy all enabled mods unless mods were globally disabled:
    if global_enabled {
        let mut deployed_files: Vec<PathBuf> = Vec::new();
        let mut deployed_mod_count = 0;
        let mut new_resources = Vec::new();

        // For each mod that is enabled:
        for r#mod in managed.mods.iter_mut() {
            if !r#mod.enabled {
                continue;
            }

            // Re-emit deployment progress, wrapped in additional information:
            let mod_title = r#mod.title.clone();
            let (mod_tx, mut mod_rx) = tokio::sync::mpsc::channel(10);
            let handle = thread::spawn(clone!([tx], move || {
                while let Some(progress) = mod_rx.blocking_recv() {
                    let _ = channel::blocking_send_opt(
                        &tx,
                        function_name!(),
                        ModsDeployProgress::Deploying {
                            mod_title: mod_title.clone(),
                            deployed_mods: deployed_mod_count,
                            total_mods: enabled_mod_count as u32,
                            progress,
                        },
                    );
                }
            }));

            // Deploy mod:
            let mod_state = deploy_mod_internal(
                r#mod,
                &mut new_resources,
                &mut deployed_files,
                mods_path,
                game_path,
                copy_method.clone(),
                keep_config_files,
                Some(mod_tx),
            )?;
            // Update state:
            managed.state.push(mod_state);
            deployed_mod_count += 1;

            let _ = handle.join().tap_err(|e| {
                log::error!(
                    "[{}] Couldn't join receiver thread: {:?}",
                    function_name!(),
                    e
                )
            });
        }

        // Update resource list:
        match resource_insertion_position {
            ResourceInsertionPosition::Prepend => list.prepend(new_resources.into_iter()),
            ResourceInsertionPosition::Append => list.append(new_resources.into_iter()),
        }
    }

    let _ = channel::blocking_send_opt(&tx, function_name!(), ModsDeployProgress::Finished);
    Ok(())
}

#[function_name::named]
fn deploy_mod_internal<P: AsRef<Path>>(
    r#mod: &mut ManagedMod,
    new_resources: &mut Vec<String>,
    deployed_files: &mut Vec<PathBuf>,
    mods_path: P,
    game_path: P,
    copy_method: ModCopyMethod,
    keep_config_files: bool,
    tx: Option<tokio::sync::mpsc::Sender<ModDeployProgress>>,
) -> ModActionResult<ModInstallationState> {
    let src_path = r#mod.folder_path(mods_path)?;
    let dst_path = r#mod.destination_path(game_path.as_ref())?;
    let game_data_path = game_path.as_ref().join("Data").normalize();

    log::info!(
        "[{}] Deploying mod '{}' from {:?} to {:?}",
        function_name!(),
        r#mod.title,
        src_path,
        dst_path
    );
    let _ = channel::blocking_send_opt(&tx, function_name!(), ModDeployProgress::Preparing);

    // Bail early if the paths aren't folders:
    if !src_path.is_dir() {
        log::error!(
            "[{}] Mod folder path is not a directory: {:?}",
            function_name!(),
            src_path
        );
        return Err(ModActionError::InvalidModFolderPath(
            src_path.to_string_lossy().to_string(),
        ));
    }
    if dst_path.exists() && !dst_path.is_dir() {
        log::error!(
            "[{}] Mod target path is not a directory: {:?}",
            function_name!(),
            dst_path
        );
        return Err(ModActionError::InvalidModTargetPath(
            dst_path.to_string_lossy().to_string(),
        ));
    }

    // Skip if mod folder is empty:
    if fs_util::is_empty(&src_path)? {
        log::trace!("[{}] Skipping empty directory", function_name!());
        // Return mod state:
        let mod_state = ModInstallationState {
            key: r#mod.key.clone(),
            root_folder: r#mod.options.root_folder.clone(),
            files: Vec::new(),
        };
        return Ok(mod_state);
    }

    // Create destination folder if it doesn't exist:
    fs::create_dir_all(&dst_path)
        .tap_err(|e| log::error!("Couldn't create mod destination folder: {e}"))?;

    // Count the total number of files in the mod folder, so we can calculate a percentage later:
    let total_files = fs_util::count_files_recursively(&src_path)?;

    // Collect folder contents and BA2 archives while copying:
    let mut files = Vec::new();
    let mut archives = Vec::new();

    // Iterate over each file in the mod's folder:
    let mut copied_files = 0;
    for file_path in fs_util::list_files_recursively(&src_path, 50)? {
        // Determine full source path, file name and file extension:
        let file_path = file_path.canonicalize()?;
        let file_name = file_path
            .file_name()
            .ok_or_else(|| ModActionError::NoBasename(file_path.to_string_lossy().to_string()))?
            .to_str()
            .ok_or_else(|| {
                ModActionError::PathUtf8Converation(file_path.to_string_lossy().to_string())
            })?;
        let file_ext = file_path
            .extension()
            .unwrap_or_default()
            .to_str()
            .ok_or_else(|| {
                ModActionError::PathUtf8Converation(file_path.to_string_lossy().to_string())
            })?;

        // Report progress:
        let _ = channel::blocking_send_opt(
            &tx,
            function_name!(),
            ModDeployProgress::Copying {
                file_name: file_name.to_string(),
                copied: copied_files,
                total: total_files as u32,
            },
        );

        // Determine relative path and full destination path:
        let relative_path = fs_util::get_relative_path(&src_path, &file_path)?;
        let dst_path = dst_path.join(&relative_path);

        // Create parent directory:
        if let Some(parent_path) = dst_path.parent() {
            fs::create_dir_all(parent_path)
                .tap_err(|e| log::error!("Couldn't create destination folder: {e}"))?;
        }

        // There are some files that should not be overwritten...
        let mut no_overwrite = false;

        // Check if it's a configuration file:
        if keep_config_files
            && CONFIG_FILE_EXTENSIONS.contains(&file_ext.to_lowercase().as_str())
            && dst_path.exists()
        {
            // Don't copy it.
            no_overwrite = true;
        }

        // Copy (or hardlink/symlink) file:
        if !no_overwrite {
            // Make a backup ("filename.ext" -> "filename.ext.old") if the file already exists:
            let file_belongs_to_another_mod = deployed_files.contains(&relative_path);
            if dst_path.exists()
                && !dst_path.with_added_extension("old").exists()
                && !file_belongs_to_another_mod
            {
                fs_util::move_file(&dst_path, dst_path.with_added_extension("old"))?;
                log::trace!(
                    "[{}] Backup file: {:?}",
                    function_name!(),
                    dst_path.with_added_extension("old"),
                );
            }

            fs_util::copy_or_link(&file_path, &dst_path, copy_method.clone().into())
                .tap_err(|e| log::error!("Couldn't copy file: {e}"))?;
        }
        copied_files += 1;

        // Add relative path to the list of all deployed files:
        deployed_files.push(relative_path.to_owned()); // Current deployment (all mods)
        let relative_path = relative_path.to_str().ok_or_else(|| {
            ModActionError::PathUtf8Converation(file_path.to_string_lossy().to_string())
        })?;
        files.push(relative_path.to_owned()); // Files of just this mod

        // If it's an archive (.ba2 extension) and in the Data folder,
        // add it to the list of archives:
        if file_ext.to_lowercase() == "ba2"
            && let Some(parent_dir) = dst_path.parent()
            && parent_dir.normalize().to_string_lossy().to_lowercase()
                == game_data_path.to_string_lossy().to_lowercase()
        {
            archives.push(file_name.to_string());
        }
    }

    // Add archives to the new resources list:
    let archive_count = archives.len();
    if archive_count > 0 {
        log::info!(
            "[{}] Found {} archives: {:?}",
            function_name!(),
            archive_count,
            archives.join(", ")
        );
        new_resources.append(&mut archives);
    } else {
        log::trace!("[{}] Found no archives", function_name!());
    }
    drop(archives);

    // Report progress:
    let _ = channel::blocking_send_opt(
        &tx,
        function_name!(),
        ModDeployProgress::Finished {
            copied: copied_files,
            resources: archive_count as u32,
        },
    );

    // Return mod state:
    let mod_state = ModInstallationState {
        key: r#mod.key.clone(),
        root_folder: r#mod.options.root_folder.clone(),
        files,
    };
    Ok(mod_state)
}

#[function_name::named]
pub fn remove_mods<P: AsRef<Path>>(
    managed: &mut ManagedMods,
    list: &mut ResourceList,
    game_path: P,
    keep_config_files: bool,
    tx: Option<tokio::sync::mpsc::Sender<ModsRemoveProgress>>,
) -> ModActionResult<()> {
    let game_path = game_path.as_ref();
    let deployed_mod_count = managed.state.len();

    log::info!(
        "[{}] Removing {} mods from {:?}",
        function_name!(),
        deployed_mod_count,
        game_path,
    );
    let _ = channel::blocking_send_opt(&tx, function_name!(), ModsRemoveProgress::Preparing);

    // For each mod that was deployed:
    let mut removed_mods = 0;
    let mut backup_files = Vec::new();
    let mut folders = Vec::new();
    let mut archives = Vec::new();
    let game_data_path = game_path.join("Data").normalize();
    for state in managed.state.iter() {
        let r#mod = managed.get_mod(&state.key);
        let mod_title = r#mod
            .map(|r#mod| r#mod.title.clone())
            .unwrap_or("Deleted mod".to_owned());
        let root_path = game_path.join(&state.root_folder);

        // Remove all files:
        let mut removed_files = 0;
        for relative_path in state.files.iter() {
            let relative_path = relative_path
                .replace(r"\", std::path::MAIN_SEPARATOR_STR)
                .replace(r"/", std::path::MAIN_SEPARATOR_STR);
            let file_path = root_path.join(&relative_path).normalize();

            // Determine file name and extension:
            let file_name = file_path
                .file_name()
                .ok_or_else(|| ModActionError::NoBasename(file_path.to_string_lossy().to_string()))?
                .to_str()
                .ok_or_else(|| {
                    ModActionError::PathUtf8Converation(file_path.to_string_lossy().to_string())
                })?;
            let file_ext = file_path
                .extension()
                .unwrap_or_default()
                .to_str()
                .ok_or_else(|| {
                    ModActionError::PathUtf8Converation(file_path.to_string_lossy().to_string())
                })?;

            // Report progress
            let _ = channel::blocking_send_opt(
                &tx,
                function_name!(),
                ModsRemoveProgress::Removing {
                    mod_title: mod_title.clone(),
                    removed_mods,
                    total_mods: deployed_mod_count as u32,
                    file_name: file_name.to_string(),
                    removed_files,
                    total_files: state.files.len() as u32,
                },
            );

            // let mut is_redeployed = false;

            // // Check if mod is redeployed with the same options:
            // if let Some(r#mod) = r#mod
            //     && r#mod.enabled
            //     && r#mod.options.root_folder == state.root_folder
            // {
            //     is_redeployed = true;
            // }

            // There are some files that should be exempt...
            let mut keep_file = false;

            // Check if it's a configuration file:
            if keep_config_files
                && CONFIG_FILE_EXTENSIONS.contains(&file_ext.to_lowercase().as_str())
            {
                // Keep configs, the user might have edited them:
                keep_file = true;
            }

            // Delete file, if existing:
            if file_path.exists() && !keep_file {
                fs::remove_file(&file_path)?;
            }
            removed_files += 1;

            // If there's a backup, add it to the list so we can move them later:
            if file_path.with_added_extension("old").exists() && !keep_file {
                backup_files.push((file_path.with_added_extension("old"), file_path.clone()));
            }

            // Add the parent path to the list of folders we might want to remove (if empty):
            if let Some(parent_path) = file_path.parent()
                && let Ok(parent_path) = parent_path.canonicalize()
                && !keep_file
            {
                folders.push(parent_path);
            }

            // If it's an archive (.ba2 extension) and in the Data folder,
            // remember to remove it later:
            if file_ext.to_lowercase() == "ba2"
                && let Some(parent_dir) = file_path.parent()
                && parent_dir.normalize().to_string_lossy().to_lowercase()
                    == game_data_path.to_string_lossy().to_lowercase()
            {
                archives.push(file_name.to_string());
            }
        }

        log::info!(
            "[{}] Removed mod '{}': {} files deleted",
            function_name!(),
            mod_title,
            removed_files,
        );
        removed_mods += 1;
    }

    // Clear state since we deleted all files:
    managed.state.clear();

    let _ = channel::blocking_send_opt(&tx, function_name!(), ModsRemoveProgress::Finalizing);

    // Restore backups ("filename.ext.old" -> "filename.ext"):
    if !backup_files.is_empty() {
        log::info!(
            "[{}] Found {} backups: {}",
            function_name!(),
            backup_files.len(),
            backup_files
                .iter()
                .map(|(src, _)| src.to_string_lossy())
                .join(", ")
        );
        for (src_path, dst_path) in backup_files {
            if src_path.exists() && !dst_path.exists() {
                fs_util::move_file(src_path, dst_path)?;
            }
        }
    } else {
        log::trace!("[{}] Found no backups", function_name!());
    }

    // Remove archives from resource list:
    if !archives.is_empty() {
        list.remove_many(&archives);
        log::info!(
            "[{}] Removed {} archives: {:?}",
            function_name!(),
            archives.len(),
            archives.join(", ")
        );
    } else {
        log::trace!("[{}] Removed no archives", function_name!());
    }

    // Cleanup empty folders:
    for folder_path in folders.into_iter().unique() {
        if folder_path.exists() {
            fs_util::remove_empty_dirs(folder_path)?;
        }
    }

    let _ = channel::blocking_send_opt(
        &tx,
        function_name!(),
        ModsRemoveProgress::Finished {
            removed_mods,
            removed_resources: archives.len() as u32,
        },
    );
    Ok(())
}

impl ManagedMod {
    /// Returns the full path to the folder containing the mod's files.
    /// e.g. `...\Fallout 76\Mods\<mod folder name>\`
    pub fn folder_path<P: AsRef<Path>>(&self, mods_path: P) -> io::Result<PathBuf> {
        mods_path.as_ref().join(&self.folder_name).canonicalize()
    }

    /// Returns the full path to the folder where the mod's files are supposed to be copied to.
    /// e.g. `...\Fallout 76\Data\`
    pub fn destination_path<P: AsRef<Path>>(&self, game_path: P) -> io::Result<PathBuf> {
        path::absolute(game_path.as_ref().join(&self.options.root_folder))
    }
}
