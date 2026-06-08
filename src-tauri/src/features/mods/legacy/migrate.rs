use std::fs;
use std::path::{Path, PathBuf};

use ini::Ini;
use normalize_path::NormalizePath;
use tap::{TapFallible, TapOptional};
use tokio::sync::mpsc::Sender;

use crate::features::archive2;
use crate::features::archive2::models::{Archive2Compression, Archive2Format};
use crate::features::mods::errors::ModActionResult;
use crate::features::mods::models::json;
use crate::features::mods::models::xml;
use crate::features::mods::utils::pack_ba2_archives;
use crate::features::mods::{
    get_legacy_mods_metadata_path, get_mods_temp_path, load_legacy_mods, load_mods,
    save_legacy_mods, save_mods,
};
use crate::features::resourcelists::{ResourceList, get_legacy_mods_resources_path};
use crate::utils::channel;
use crate::utils::fs_util;

use super::ModsMigrationProgress;

const BUNDLED_ARCHIVES: &[&str] = &[
    "Bundled.ba2",
    "Bundled - General.ba2", // Should normally just be "Bundled.ba2", include it just in case.
    "Bundled - Textures.ba2",
    "Bundled - Sounds.ba2",
    "Bundled - Interface.ba2",
];

/// Path to the mod's frozen archive.
/// Example: @"C:\Program Files (x86)\Steam\steamapps\common\Fallout 76\FrozenData\{2f2d3b3b-b21b-4ec2-b555-c8806a801b16}.ba2"
fn get_frozen_archive_path<P: AsRef<Path>, S: AsRef<str>>(
    mods_path: P,
    guid: S,
) -> anyhow::Result<PathBuf> {
    Ok(mods_path
        .as_ref()
        .parent()
        .ok_or(anyhow::anyhow!(
            "Couldn't get the parent directory from mods path"
        ))?
        .join("FrozenData")
        .join(format!("{{{}}}.ba2", guid.as_ref())))
}

pub fn cleanup_resources(resources_to_remove: Vec<String>, ini: &mut Ini) {
    for key in ["sResourceIndexFileList", "sResourceArchive2List"] {
        let mut list =
            ResourceList::load_from_ini(ini, Some("Archive".to_string()), key.to_string());
        list.remove_many(&resources_to_remove);
        list.save_to_ini(ini, Some("Archive"), key);
    }
}

#[function_name::named]
pub fn remove_bundled_archives<P: AsRef<Path>>(
    game_path: P,
    ini: &mut Ini,
    tx: Option<Sender<ModsMigrationProgress>>,
) -> ModActionResult<()> {
    log::trace!("Removing bundled archives");
    let _ = channel::blocking_send_opt(
        &tx,
        function_name!(),
        ModsMigrationProgress::RemovingBundledArchives,
    );
    let game_path = game_path.as_ref();
    let mut resources_to_remove: Vec<String> = Vec::new();

    // Delete bundled archives:
    for archive in BUNDLED_ARCHIVES {
        let archive_path = game_path.join("Data").join(archive);

        // Delete file, if existing:
        if archive_path.exists() {
            fs::remove_file(&archive_path)?;
            log::trace!("Removed {archive_path:?}");
        }

        resources_to_remove.push(archive.to_string());
    }

    log::trace!("Removing resources: {}", resources_to_remove.join(", "));
    cleanup_resources(resources_to_remove, ini);
    Ok(())
}

/// Removes the mods exactly as v1 did.
#[function_name::named]
pub fn remove_all_old_mods<P: AsRef<Path>>(
    game_path: P,
    mods_path: P,
    ini: &mut Ini,
    tx: Option<Sender<ModsMigrationProgress>>,
) -> ModActionResult<()> {
    log::trace!("Removing all old mods");
    let game_path = game_path.as_ref();
    let mods_path = mods_path.as_ref();
    let resources_txt_path = get_legacy_mods_resources_path(mods_path);

    // Load meta data file:
    let mut legacy_managed = load_legacy_mods(mods_path)
        .tap_err(|e| log::error!("Couldn't load managed.xml: {e:?}"))?
        .tap_none(|| log::error!("Couldn't load managed.xml: managed.xml does not exist"))
        .ok_or(anyhow::anyhow!("managed.xml does not exist"))?;

    // Delete bundled archives:
    remove_bundled_archives(game_path, ini, tx.clone())
        .tap_err(|e| log::error!("Couldn't remove bundled archives: {e:?}"))?;

    let mut resources_to_remove = Vec::new();

    // Remove mods:
    let total_mods = legacy_managed.mods.len();
    for (mod_index, r#mod) in legacy_managed.mods.iter_mut().enumerate() {
        log::trace!("Mod {}", r#mod.title);
        if !r#mod.state.current.deployed {
            log::trace!("Not deployed, skipped.");
            continue;
        }
        let _ = channel::blocking_send_opt(
            &tx,
            function_name!(),
            ModsMigrationProgress::RemovingMod {
                mod_title: r#mod.title.clone(),
                current_mod: mod_index as u32,
                total_mods: total_mods as u32,
            },
        );
        match r#mod.state.current.installation_method {
            xml::InstallationMethod::LooseFiles => {
                let root_path = game_path.join(&r#mod.state.current.root_folder);
                let Some(ref files) = r#mod.state.current.installed_loose_files.files else {
                    continue;
                };
                for file in files.iter() {
                    let relative_path = file
                        .path
                        .replace(r"\", std::path::MAIN_SEPARATOR_STR)
                        .replace(r"/", std::path::MAIN_SEPARATOR_STR);
                    let file_path = root_path.join(&relative_path).normalize();

                    // Delete file, if existing:
                    if file_path.exists() {
                        fs::remove_file(&file_path)?;
                        log::trace!("Removed {file_path:?}");
                    }

                    // Rename backup, if there is one:
                    if file_path.with_added_extension("old").exists() {
                        fs_util::move_file(
                            file_path.with_added_extension("old"),
                            file_path.clone(),
                        )?;
                        log::trace!("Restored {:?}", file_path.with_added_extension("old"));
                    }
                    // Remove empty folders one by one, if existing:
                    else if let Some(folder_path) = file_path.parent()
                        && folder_path.exists()
                    {
                        fs_util::remove_empty_dirs(folder_path)?;
                    }
                }

                r#mod.state.current.installed_loose_files.files = None;
            }
            xml::InstallationMethod::BundledBA2 => (),
            xml::InstallationMethod::SeparateBA2 => {
                // Get the current archive path:
                let current_path = game_path
                    .join("Data")
                    .join(&r#mod.state.current.archive_name);

                // Delete file, if existing:
                if current_path.exists() {
                    fs::remove_file(&current_path)?;
                    log::trace!("Removed {current_path:?}");
                }

                resources_to_remove.push(r#mod.state.current.archive_name.clone());
            }
        }

        r#mod.state.current.deployed = false;
    }

    log::trace!("Saving managed.xml in {mods_path:?}");
    save_legacy_mods(mods_path, &legacy_managed)?;
    log::trace!("Truncating resources.txt in {mods_path:?}");
    fs_util::write_to_file(&resources_txt_path, "")?; // Truncate resources.txt

    log::trace!("Removing resources: {}", resources_to_remove.join(", "));
    cleanup_resources(resources_to_remove, ini);

    Ok(())
}

#[function_name::named]
pub fn migrate_legacy_managed_mods<P: AsRef<Path>>(
    game_path: P,
    mods_path: P,
    ini: &mut Ini,
    tx: Option<Sender<ModsMigrationProgress>>,
) -> ModActionResult<()> {
    // Gather paths:
    let game_path = game_path.as_ref();
    let mods_path = mods_path.as_ref();
    let old_mods_path = mods_path
        .parent()
        .ok_or(anyhow::anyhow!(
            "Couldn't get the parent directory from mods path"
        ))?
        .join("Mods.old");
    let tmp_path = get_mods_temp_path(mods_path);
    let frozen_data_path = mods_path
        .parent()
        .ok_or(anyhow::anyhow!(
            "Couldn't get the parent directory from mods path"
        ))?
        .join("FrozenData");

    log::trace!("Migrating old mods from managed.xml in {mods_path:?}");

    // Delete all mods from game path, produce blank slate:
    remove_all_old_mods(game_path, mods_path, ini, tx.clone())
        .tap_err(|e| log::error!("Couldn't remove old mods: {e}"))?;

    // Load meta data files:
    let legacy_managed = load_legacy_mods(mods_path)
        .tap_err(|e| log::error!("Couldn't load managed.xml: {e:?}"))?
        .tap_none(|| log::error!("Couldn't load managed.xml: managed.xml does not exist"))
        .ok_or(anyhow::anyhow!("managed.xml does not exist"))?;
    let mut managed = load_mods(mods_path)?.unwrap_or_default();

    // Move current "Mods" folder to "Mods.old" and create a new "Mods" folder:
    log::trace!("Renaming {mods_path:?} to {old_mods_path:?}");
    fs::rename(mods_path, &old_mods_path)?;
    fs::create_dir(mods_path)?;

    // Make sure the temporary folder is empty:
    if tmp_path.exists() && !fs_util::is_empty(&tmp_path)? {
        log::trace!("Deleting temporary folder {tmp_path:?}");
        fs::remove_dir_all(&tmp_path)?;
    }

    managed.enabled = legacy_managed.enabled;
    managed.migrated_from_v1 = Some(json::Migration {
        date: chrono::Utc::now(),
    });

    // Migrate each mod depending on it's legacy installation method:
    let total_mods = legacy_managed.mods.len();
    for (mod_index, r#mod) in legacy_managed.mods.into_iter().enumerate() {
        let _ = channel::blocking_send_opt(
            &tx,
            function_name!(),
            ModsMigrationProgress::MigratingMod {
                mod_title: r#mod.title.clone(),
                current_mod: mod_index as u32,
                total_mods: total_mods as u32,
            },
        );
        log::trace!("Migrating mod: {}", r#mod.title);

        // Create new mod folder:
        fs::create_dir_all(mods_path.join(&r#mod.folder))?;

        // Migrate mod files:
        match r#mod.state.pending.installation_method {
            xml::InstallationMethod::LooseFiles => {
                // Method: "Copy files over without packing"
                // Just move the files as is.
                let src_path = old_mods_path.join(&r#mod.folder);
                let dst_path = mods_path.join(&r#mod.folder);

                // Create the mod folder:
                fs::create_dir_all(&dst_path)?;

                if src_path.exists() {
                    log::trace!(
                        "Loose files --> Moving mod folder from {src_path:?} to {dst_path:?}"
                    );
                    fs_util::move_folder(&src_path, &dst_path)?;
                } else {
                    log::warn!("Mod folder {src_path:?} does not exist. Skipping.");
                }

                // Add mod to the list of installed mods:
                managed.remove_mod(&r#mod.guid); // Dedup
                managed.mods.push(r#mod.clone().into());
            }
            xml::InstallationMethod::BundledBA2 => {
                // Method: "Bundle it with other mods in one package"
                // This method is no longer supported. Instead create multiple archives in the mod's folder.
                // They won't be called "Bundled - *.ba2" anymore, instead it will be called "Modname - *.ba2".
                let mod_name = fs_util::sanitize_filename(&r#mod.title, '_');
                let src_path = old_mods_path.join(&r#mod.folder);
                let dst_path = mods_path.join(&r#mod.folder);

                // Create the mod folder:
                fs::create_dir_all(&dst_path)?;

                if src_path.exists() && !fs_util::is_empty(&src_path)? {
                    log::trace!("Bundled BA2 --> Packing BA2 archives");
                    pack_ba2_archives(&mod_name, &src_path, &dst_path, &tmp_path)?;

                    // Remove old folder:
                    fs::remove_dir_all(&src_path)?;
                } else if src_path.exists() {
                    log::warn!("Mod folder {src_path:?} is empty. Skipping.");
                } else {
                    log::warn!("Mod folder {src_path:?} does not exist. Skipping.");
                }

                // Add mod to the list of installed mods:
                managed.remove_mod(&r#mod.guid); // Dedup
                managed.mods.push(json::ManagedMod {
                    options: json::ModInstallationOptions {
                        root_folder: ".".to_string(),
                    },
                    ..r#mod.clone().into()
                });
            }
            xml::InstallationMethod::SeparateBA2 => {
                // Method: "Pack it as a separate *.ba2 archive"
                // This method has a ton of options, such as being able to "freeze" archives.

                // If the archive was "frozen" and the frozen archive still exists:
                if r#mod.state.pending.installation_method
                    == r#mod.state.current.installation_method
                    && r#mod.state.frozen_data.frozen
                {
                    let frozen_path = get_frozen_archive_path(mods_path, &r#mod.guid)?;
                    if frozen_path.is_file() {
                        let dst_path = mods_path
                            .join(&r#mod.folder)
                            .join(&r#mod.state.pending.archive_name);
                        log::trace!("Frozen Separate BA2 --> Moving frozen BA2 archive");
                        fs_util::move_file(&frozen_path, &dst_path)?;

                        // Remove old folder:
                        let old_folder = old_mods_path.join(&r#mod.folder);
                        if old_folder.exists() {
                            fs::remove_dir_all(&old_folder)?;
                        }

                        // Add mod to the list of installed mods:
                        managed.remove_mod(&r#mod.guid); // Dedup
                        managed.mods.push(json::ManagedMod {
                            options: json::ModInstallationOptions {
                                root_folder: "Data".to_string(),
                            },
                            ..r#mod.clone().into()
                        });

                        continue;
                    }
                }

                // If the archive has specific format and compression set
                // then create a new archive with these exact options:
                if r#mod.state.pending.archive_format != xml::ArchiveFormat::Auto
                    && r#mod.state.pending.archive_compression != xml::ArchiveCompression::Auto
                {
                    let src_path = old_mods_path.join(&r#mod.folder);
                    let dst_path = mods_path.join(&r#mod.folder);
                    let ba2_archive = dst_path.join(&r#mod.state.pending.archive_name);
                    let format: Archive2Format =
                        r#mod.state.pending.archive_format.clone().try_into()?;
                    let compression: Archive2Compression =
                        r#mod.state.pending.archive_compression.clone().try_into()?;

                    // Create the mod folder:
                    fs::create_dir_all(&dst_path)?;

                    if src_path.exists() && !fs_util::is_empty(&src_path)? {
                        log::trace!(
                            "Separate BA2 with specific format and compression --> Creating BA2 archive"
                        );
                        archive2::create_archive2(&ba2_archive, &src_path, format, compression)?;

                        // Remove old folder:
                        fs::remove_dir_all(&src_path)?;
                    } else if src_path.exists() {
                        log::warn!("Mod folder {src_path:?} is empty. Skipping.");
                    } else {
                        log::warn!("Mod folder {src_path:?} does not exist. Skipping.");
                    }

                    // Add mod to the list of installed mods:
                    managed.remove_mod(&r#mod.guid); // Dedup
                    managed.mods.push(json::ManagedMod {
                        options: json::ModInstallationOptions {
                            root_folder: "Data".to_string(),
                        },
                        ..r#mod.clone().into()
                    });

                    continue;
                }

                // If the archive is not "frozen" and format and compression are set to "Auto"
                // then v1 would usually try to infer the format and compression based on the folder's content.
                // This has always been fragile. Let's use the same algorithm here as is used for "BundledBA2":
                let mod_name = fs_util::sanitize_filename(&r#mod.title, '_');
                let src_path = old_mods_path.join(&r#mod.folder);
                let dst_path = mods_path.join(&r#mod.folder);

                // Create the mod folder:
                fs::create_dir_all(&dst_path)?;

                if src_path.exists() && !fs_util::is_empty(&src_path)? {
                    log::trace!("Separate BA2 with \"Auto\" preset --> Packing BA2 archives");
                    pack_ba2_archives(&mod_name, &src_path, &dst_path, &tmp_path)?;

                    // Remove old folder:
                    fs::remove_dir_all(&src_path)?;
                } else if src_path.exists() {
                    log::warn!("Mod folder {src_path:?} is empty. Skipping.");
                } else {
                    log::warn!("Mod folder {src_path:?} does not exist. Skipping.");
                }

                // Add mod to the list of installed mods:
                managed.remove_mod(&r#mod.guid); // Dedup
                managed.mods.push(json::ManagedMod {
                    options: json::ModInstallationOptions {
                        root_folder: ".".to_string(),
                    },
                    ..r#mod.clone().into()
                });
            }
        }
    }

    // Save new metadata:
    log::trace!("Saving mods.json in {mods_path:?}");
    save_mods(mods_path, &managed)?;
    log::trace!("Saving legacy managed.xml in {mods_path:?}");
    save_legacy_mods(mods_path, &managed.into())?;
    log::trace!("Moving legacy resources.txt from {old_mods_path:?} to {mods_path:?}");
    let _ = fs_util::move_file(
        old_mods_path.join("resources.txt"),
        mods_path.join("resources.txt"),
    )
    .tap_err(|e| log::error!("Couldn't move Mods.old/resources.txt to Mods/resources.txt: {e}"));

    // Cleanup files:
    let _ = channel::blocking_send_opt(&tx, function_name!(), ModsMigrationProgress::Cleanup);
    log::trace!("Deleting Mods.old");
    if old_mods_path.exists() {
        fs::remove_dir_all(&old_mods_path)?;
    }
    log::trace!("Deleting FrozenData");
    if frozen_data_path.exists() {
        fs::remove_dir_all(&frozen_data_path)?;
    }

    Ok(())
}

#[function_name::named]
pub fn remove_legacy_managed_mods<P: AsRef<Path>>(
    game_path: P,
    mods_path: P,
    ini: &mut Ini,
    tx: Option<Sender<ModsMigrationProgress>>,
) -> ModActionResult<()> {
    // Gather paths:
    let game_path = game_path.as_ref();
    let mods_path = mods_path.as_ref();
    let tmp_path = get_mods_temp_path(mods_path);
    let frozen_data_path = mods_path
        .parent()
        .ok_or(anyhow::anyhow!(
            "Couldn't get the parent directory from mods path"
        ))?
        .join("FrozenData");
    let legacy_metadata_path = get_legacy_mods_metadata_path(mods_path);
    let resources_txt_path = get_legacy_mods_resources_path(mods_path);

    log::trace!("Deleting old mods from managed.xml in {mods_path:?}");

    // Delete all mods from game path, produce blank slate:
    remove_all_old_mods(game_path, mods_path, ini, tx.clone())
        .tap_err(|e| log::error!("Couldn't remove old mods: {e}"))?;

    // Cleanup files:
    let _ = channel::blocking_send_opt(&tx, function_name!(), ModsMigrationProgress::Cleanup);
    if frozen_data_path.exists() {
        fs::remove_dir_all(&frozen_data_path)?;
    }
    if legacy_metadata_path.exists() {
        fs::remove_file(&legacy_metadata_path)?;
    }
    if resources_txt_path.exists() {
        fs::remove_file(&resources_txt_path)?;
    }
    if tmp_path.exists() {
        fs::remove_dir_all(&tmp_path)?;
    }
    if mods_path.exists() {
        fs::remove_dir_all(mods_path)?;
    }

    Ok(())
}
