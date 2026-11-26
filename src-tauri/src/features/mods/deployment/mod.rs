//! All actions that deploy or remove mods: add, remove, or change game files.

#[cfg(test)]
pub mod tests;

use std::collections::{HashMap, HashSet};
use std::path::{self, Path, PathBuf};
use std::{fs, io};

use itertools::Itertools;
use normalize_path::NormalizePath;
use tap::TapFallible;

use crate::features::mods::errors::{ModActionError, ModActionResult};
use crate::features::mods::models::json::{ManagedMod, ManagedMods, ModInstallationState};
use crate::features::resourcelists::ResourceList;
use crate::features::stores::settings::models::{ModCopyMethod, ResourceInsertionPosition};
use crate::utils::fs_util;

mod models;
pub use models::*;

pub const CONFIG_FILE_EXTENSIONS: &[&str] = &[
    "ini", "json", "jsonc", "yaml", "yml", "xml", "toml", "conf", "cfg",
];

#[derive(Clone)]
pub struct DeployModsOptions {
    pub copy_method: ModCopyMethod,
    pub resource_insertion_position: ResourceInsertionPosition,
    pub keep_config_files: bool,
    pub compare_files: bool,
}

/// Tracks the destination files of a deployment run.
struct DeployedFiles {
    /// Destination paths that were actually copied/linked in this run (across all mods).
    deployed: Vec<PathBuf>,
    /// Previously deployed files that were kept during removal because they were
    /// already compared and found identical to the file that will be redeployed.
    kept: HashSet<PathBuf>,
}

/// Per-mod progress reporting context within a `deploy_mods` run.
struct ModProgress<'a> {
    mod_title: String,
    deployed_mods: u32,
    total_mods: u32,
    on_progress: &'a dyn Fn(ModsDeployProgress),
}

#[function_name::named]
pub fn deploy_mods<P: AsRef<Path>>(
    managed: &mut ManagedMods,
    list: &mut ResourceList,
    mods_path: P,
    game_path: P,
    options: DeployModsOptions,
    on_progress: &dyn Fn(ModsDeployProgress),
) -> ModActionResult<()> {
    let start_time = std::time::Instant::now();
    let global_enabled = managed.enabled;
    let mods_path = mods_path.as_ref();
    let game_path = game_path.as_ref();
    let enabled_mod_count = managed.mods.iter().filter(|m| m.enabled).count();

    log::info!(
        "[{}] Deploying {} mods from {:?} to {:?} (global enabled: {}, copy method: {:?}, compare files: {:?})",
        function_name!(),
        enabled_mod_count,
        mods_path,
        game_path,
        global_enabled,
        options.copy_method,
        options.compare_files
    );

    // Check all enabled mods for invalid paths:
    for r#mod in managed.mods.iter() {
        if !r#mod.enabled {
            continue;
        }
        r#mod.folder_path(mods_path)?;
        r#mod.destination_path(game_path)?;
    }

    // Determine which previously deployed files can be kept because an enabled
    // mod will redeploy a byte-identical file to the same path:
    let files_to_keep = if options.compare_files && global_enabled {
        find_files_to_keep(managed, mods_path, game_path, on_progress)?
    } else {
        HashSet::new()
    };
    if !files_to_keep.is_empty() {
        log::info!(
            "[{}] Keeping {} files that will be redeployed identically",
            function_name!(),
            files_to_keep.len()
        );
    }

    // Removing all mods prior to deployment:
    remove_mods(
        managed,
        list,
        game_path,
        &options,
        &files_to_keep,
        on_progress,
    )?;

    // Deploy all enabled mods unless mods were globally disabled:
    if global_enabled {
        let mut deployed_files = DeployedFiles {
            deployed: Vec::new(),
            kept: files_to_keep,
        };
        let mut deployed_mod_count = 0;
        let mut new_resources = Vec::new();

        // For each mod that is enabled:
        for r#mod in managed.mods.iter_mut() {
            if !r#mod.enabled {
                continue;
            }

            // Deploy mod:
            let progress = ModProgress {
                mod_title: r#mod.title.clone(),
                deployed_mods: deployed_mod_count,
                total_mods: enabled_mod_count as u32,
                on_progress,
            };
            let mod_state = deploy_mod_internal(
                r#mod,
                &mut new_resources,
                &mut deployed_files,
                mods_path,
                game_path,
                &options,
                &progress,
            )?;
            // Update state:
            managed.state.push(mod_state);
            deployed_mod_count += 1;
        }

        // Update resource list:
        match options.resource_insertion_position {
            ResourceInsertionPosition::Prepend => list.prepend(new_resources.into_iter()),
            ResourceInsertionPosition::Append => list.append(new_resources.into_iter()),
        }
    }

    let duration = start_time.elapsed();
    log::info!("Deployment took {duration:?}");

    Ok(())
}

/// Returns the previously deployed files (from `managed.state`) that can be kept during
/// removal because an enabled mod will redeploy a byte-identical file to the same path.
#[function_name::named]
fn find_files_to_keep<P: AsRef<Path>>(
    managed: &ManagedMods,
    mods_path: P,
    game_path: P,
    on_progress: &dyn Fn(ModsDeployProgress),
) -> ModActionResult<HashSet<PathBuf>> {
    let mods_path = mods_path.as_ref();
    let game_path = game_path.as_ref();

    let enabled_mods = managed.mods.iter().filter(|r#mod| r#mod.enabled).count();

    // Map the destination path of each file that will be deployed to its source path.
    // If multiple mods deploy to the same path, the last one wins (same as during deployment):
    let mut redeploy_sources: HashMap<PathBuf, PathBuf> = HashMap::new();
    for (compared_mods, r#mod) in managed
        .mods
        .iter()
        .filter(|r#mod| r#mod.enabled)
        .enumerate()
    {
        on_progress(ModsDeployProgress::Comparing {
            mod_title: r#mod.title.clone(),
            compared_mods: compared_mods as u32,
            total_mods: enabled_mods as u32,
        });

        let src_path = r#mod.folder_path(mods_path)?;
        let dst_root = r#mod.destination_path(game_path)?;
        for file_path in fs_util::list_files_recursively(&src_path, 50)? {
            let file_path = file_path.canonicalize()?;
            let relative_path = fs_util::get_relative_path(&src_path, &file_path)?;
            redeploy_sources.insert(
                fs_util::join_normalized(&dst_root, &relative_path)?,
                file_path,
            );
        }
    }

    // Keep all previously deployed files whose new source file is identical:
    let mut files_to_keep = HashSet::new();
    for state in managed.state.iter() {
        let root_path = game_path.join(&state.root_folder);
        for relative_path in state.files.iter() {
            let file_path = fs_util::join_normalized(&root_path, relative_path)?;
            if let Some(src_path) = redeploy_sources.get(&file_path)
                && file_path.is_file()
                && fs_util::files_equal(src_path, &file_path)
                    .tap_err(|e| log::warn!("[{}] Couldn't compare files: {e}", function_name!()))
                    .unwrap_or(false)
            {
                files_to_keep.insert(file_path);
            }
        }
    }
    Ok(files_to_keep)
}

#[function_name::named]
fn deploy_mod_internal<P: AsRef<Path>>(
    r#mod: &mut ManagedMod,
    new_resources: &mut Vec<String>,
    deployed_files: &mut DeployedFiles,
    mods_path: P,
    game_path: P,
    options: &DeployModsOptions,
    progress: &ModProgress,
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
    (progress.on_progress)(ModsDeployProgress::PreparingDeploymentOfMod {
        mod_title: progress.mod_title.clone(),
        deployed_mods: progress.deployed_mods,
        total_mods: progress.total_mods,
    });

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
            outdated: false,
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
    let mut skipped_files = 0;
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
        (progress.on_progress)(ModsDeployProgress::DeployingMod {
            mod_title: progress.mod_title.clone(),
            deployed_mods: progress.deployed_mods,
            total_mods: progress.total_mods,
            file_name: file_name.to_string(),
            copied_files,
            total_files: total_files as u32,
        });

        // Determine relative path and full destination path:
        let relative_path = fs_util::get_relative_path(&src_path, &file_path)?;
        let deployed_path = fs_util::join_normalized(&dst_path, &relative_path)?;
        let dst_path = dst_path.join(&relative_path);

        // Create parent directory:
        if let Some(parent_path) = dst_path.parent() {
            fs::create_dir_all(parent_path)
                .tap_err(|e| log::error!("Couldn't create destination folder: {e}"))?;
        }

        // There are some files that should not be overwritten...
        let mut no_overwrite = false;

        // Check if it's a configuration file:
        if options.keep_config_files
            && CONFIG_FILE_EXTENSIONS.contains(&file_ext.to_lowercase().as_str())
            && dst_path.exists()
        {
            // Don't copy it.
            no_overwrite = true;
        }

        // Copy (or hardlink/symlink) file:
        if !no_overwrite {
            // Skip the backup and copy if the file was kept during removal: it was already
            // compared there and found identical to the file that will be redeployed, and
            // no other mod has deployed to this path yet in this run:
            let skip_copy = options.compare_files
                && deployed_files.kept.contains(&deployed_path)
                && !deployed_files.deployed.contains(&deployed_path)
                && dst_path.is_file();

            if skip_copy {
                skipped_files += 1;
                log::trace!(
                    "[{}] Skipping identical file: {:?}",
                    function_name!(),
                    dst_path
                );
            } else {
                // Make a backup ("filename.ext" -> "filename.ext.old") if the file already exists.
                // Files that were kept during removal are mod-owned, so they don't need a backup:
                let file_is_mod_owned = deployed_files.deployed.contains(&deployed_path)
                    || deployed_files.kept.contains(&deployed_path);
                if dst_path.exists()
                    && !dst_path.with_added_extension("old").exists()
                    && !file_is_mod_owned
                {
                    fs_util::move_file(&dst_path, dst_path.with_added_extension("old"))?;
                    log::trace!(
                        "[{}] Backup file: {:?}",
                        function_name!(),
                        dst_path.with_added_extension("old"),
                    );
                }

                fs_util::copy_or_link(&file_path, &dst_path, options.copy_method.clone().into())
                    .tap_err(|e| log::error!("Couldn't copy file: {e}"))?;

                // Add destination path to the list of all deployed files:
                deployed_files.deployed.push(deployed_path); // Current deployment (all mods)
            }
        }
        copied_files += 1;

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

    if skipped_files > 0 {
        log::info!(
            "[{}] Skipped {} identical files",
            function_name!(),
            skipped_files
        );
    }

    // Report progress:
    (progress.on_progress)(ModsDeployProgress::FinishedModDeployment {
        mod_title: progress.mod_title.clone(),
        deployed_mods: progress.deployed_mods,
        total_mods: progress.total_mods,
        copied: copied_files,
        skipped: skipped_files,
        resources: archive_count as u32,
    });

    // Return mod state:
    let mod_state = ModInstallationState {
        key: r#mod.key.clone(),
        root_folder: r#mod.options.root_folder.clone(),
        files,
        outdated: false,
    };
    Ok(mod_state)
}

#[function_name::named]
pub fn remove_mods<P: AsRef<Path>>(
    managed: &mut ManagedMods,
    list: &mut ResourceList,
    game_path: P,
    options: &DeployModsOptions,
    files_to_keep: &HashSet<PathBuf>,
    on_progress: &dyn Fn(ModsDeployProgress),
) -> ModActionResult<()> {
    let game_path = game_path.as_ref();
    let deployed_mod_count = managed.state.len();

    log::info!(
        "[{}] Removing {} mods from {:?}",
        function_name!(),
        deployed_mod_count,
        game_path,
    );
    // For each mod that was deployed:
    let mut backup_files = Vec::new();
    let mut folders = Vec::new();
    let mut archives = Vec::new();
    let game_data_path = game_path.join("Data").normalize();
    for (removed_mods, state) in managed.state.iter().enumerate() {
        let r#mod = managed.get_mod(&state.key);
        let mod_title = r#mod
            .map(|r#mod| r#mod.title.clone())
            .unwrap_or("Deleted mod".to_owned());
        let root_path = game_path.join(&state.root_folder);

        // Remove all files:
        let mut removed_files = 0;
        let mut skipped_files = 0;
        for relative_path in state.files.iter() {
            let file_path = fs_util::join_normalized(&root_path, relative_path)?;

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
            on_progress(ModsDeployProgress::RemovingMod {
                mod_title: mod_title.clone(),
                removed_mods: removed_mods as u32,
                total_mods: deployed_mod_count as u32,
                file_name: file_name.to_string(),
                removed_files,
                total_files: state.files.len() as u32,
            });

            // Check if the file was kept because it will be redeployed identically:
            let keep_because_redeployed = files_to_keep.contains(&file_path);
            if keep_because_redeployed {
                log::trace!(
                    "[{}] Keeping file that will be redeployed identically: {:?}",
                    function_name!(),
                    file_path
                );
            }

            // There are some files that should be exempt...
            let mut keep_file = keep_because_redeployed;

            // Check if it's a configuration file:
            if options.keep_config_files
                && CONFIG_FILE_EXTENSIONS.contains(&file_ext.to_lowercase().as_str())
            {
                // Keep configs, the user might have edited them:
                keep_file = true;
            }

            // Delete file, if existing:
            if file_path.exists() && !keep_file {
                fs::remove_file(&file_path)?;
            } else {
                skipped_files += 1;
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
            "[{}] Removed mod '{}': {} files deleted, {} files skipped",
            function_name!(),
            mod_title,
            removed_files - skipped_files,
            skipped_files,
        );
    }

    // Clear state since we deleted all files:
    managed.state.clear();

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
