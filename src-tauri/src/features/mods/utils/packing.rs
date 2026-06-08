use std::{
    fs,
    path::{Path, PathBuf},
};

use camino::Utf8PathBuf;
use tap::TapFallible;

use crate::{
    features::{
        archive2::{self, models::Archive2Preset},
        mods::errors::ModActionResult,
    },
    utils::fs_util,
};

pub const GENERAL_FILE_EXTENSIONS: &[&str] = &["nif", "hkx", "bgem", "bgsm", "tome", "txt"];
pub const TEXTURES_FILE_EXTENSIONS: &[&str] = &["dds"];
pub const SOUND_FILE_EXTENSIONS: &[&str] = &["wav", "xwm", "fuz", "lip"];
pub const INTERFACE_FILE_EXTENSIONS: &[&str] = &["swf", "xml", "txt"];
pub const MISC_FILE_EXTENSIONS: &[&str] = &["fxp", "pex", "json", "txt", "bin", "dat"];

pub const GENERAL_FOLDERS: &[&str] = &["meshes", "materials", "vis", "geoexporter"];
pub const TEXTURES_FOLDERS: &[&str] = &["textures", "effects"];
pub const SOUND_FOLDERS: &[&str] = &["sound", "music"];
pub const INTERFACE_FOLDERS: &[&str] = &["interface", "programs"];
pub const MISC_FOLDERS: &[&str] = &["shadersfx", "scripts", "misc"];

/// Create individual ba2 archives for files automatically.
/// Sorts them into different archive types, keeps "loose" files around if they fit nowhere.
pub fn pack_ba2_archives<S: AsRef<str>, P: AsRef<Path>>(
    mod_name: S,
    src_path: P,
    dst_path: P,
    tmp_path: P,
) -> ModActionResult<()> {
    log::trace!(
        "Packing BA2 archives for mod {} from {:?} to {:?} using the temporary folder {:?}.",
        mod_name.as_ref(),
        src_path.as_ref(),
        dst_path.as_ref(),
        tmp_path.as_ref()
    );
    let mut pack = ModPack {
        general: PackArchive::new(
            mod_name.as_ref(),
            tmp_path.as_ref(),
            ArchiveType::General,
            Archive2Preset::General,
        ),
        textures: PackArchive::new(
            mod_name.as_ref(),
            tmp_path.as_ref(),
            ArchiveType::Textures,
            Archive2Preset::Textures,
        ),
        sounds: PackArchive::new(
            mod_name.as_ref(),
            tmp_path.as_ref(),
            ArchiveType::Sounds,
            Archive2Preset::AudioAndUI,
        ),
        interface: PackArchive::new(
            mod_name.as_ref(),
            tmp_path.as_ref(),
            ArchiveType::Interface,
            Archive2Preset::AudioAndUI,
        ),
        misc: PackArchive::new(
            mod_name.as_ref(),
            tmp_path.as_ref(),
            ArchiveType::Miscellaneous,
            Archive2Preset::AudioAndUI,
        ),
        loose_files_path: tmp_path.as_ref().join("Other"),
    };
    copy_files_to_temp_sorted(src_path.as_ref(), &mut pack)
        .tap_err(|e| log::error!("Failed to sort and copy files to the temporary folders: {e}"))?;
    pack_archives_from_temp_sorted(dst_path.as_ref(), &pack)
        .tap_err(|e| log::error!("Failed to pack archives from the temporary folders: {e}"))?;
    move_loose_files_from_temp_sorted(dst_path.as_ref(), &pack)
        .tap_err(|e| log::error!("Failed to move loose files from the temporary folders: {e}"))?;
    if tmp_path.as_ref().exists() {
        fs::remove_dir_all(tmp_path.as_ref())?;
    }
    Ok(())
}

#[derive(strum::AsRefStr)]
enum ArchiveType {
    General,
    Textures,
    Sounds,
    Interface,
    Miscellaneous,
}

struct PackArchive<'a> {
    mod_name: &'a str,
    tmp_path: &'a Path,
    r#type: ArchiveType,
    preset: Archive2Preset,
    count: u32,
}

impl<'a> PackArchive<'a> {
    fn new(
        mod_name: &'a str,
        tmp_path: &'a Path,
        r#type: ArchiveType,
        preset: Archive2Preset,
    ) -> Self {
        Self {
            mod_name,
            tmp_path,
            r#type,
            preset,
            count: 0,
        }
    }

    fn name(&self) -> &str {
        self.r#type.as_ref()
    }

    fn archive_name(&self) -> String {
        match self.r#type {
            ArchiveType::General => format!("{}.ba2", self.mod_name),
            _ => format!("{} - {}.ba2", self.mod_name, self.name()),
        }
    }

    fn path(&self) -> PathBuf {
        self.tmp_path.join(self.r#type.as_ref())
    }
}

struct ModPack<'a> {
    general: PackArchive<'a>,
    textures: PackArchive<'a>,
    sounds: PackArchive<'a>,
    interface: PackArchive<'a>,
    misc: PackArchive<'a>,
    loose_files_path: PathBuf,
}

/// Sort files into different temporary folders based on their file extension.
/// Copies files from `src_path` into each of the temporary directories from `pack`.
fn copy_files_to_temp_sorted<P: AsRef<Path>>(
    src_path: P,
    pack: &mut ModPack,
) -> ModActionResult<()> {
    for file_path in fs_util::list_files_recursively(src_path.as_ref(), 50)? {
        // Collect information on file:
        let file_path: Utf8PathBuf = file_path.try_into()?;
        let file_name = file_path
            .file_name()
            .ok_or(anyhow::anyhow!("Could not get file name for {file_path}"))?;
        let file_ext = file_path.extension().unwrap_or_default();

        // Make a relative path:
        let relative_path: Utf8PathBuf =
            fs_util::get_relative_path(src_path.as_ref(), &file_path)?.try_into()?;

        // Make it relative to the data folder:
        let relative_to_data_path: Utf8PathBuf = if let Some(folder_name) =
            relative_path.components().next()
            && folder_name.as_str().to_lowercase() == "data"
        {
            // strip "data" from the start of the path:
            relative_path.strip_prefix(folder_name)?.to_path_buf()
        } else {
            // assume we're in the data folder already:
            relative_path.clone()
        };

        // Determine the type of archive:
        let dst_path;
        let folder_name = relative_to_data_path
            .components()
            .map(|c| c.as_str().to_lowercase())
            .next()
            .unwrap_or_default();

        if SOUND_FOLDERS.contains(&folder_name.as_str())
            && SOUND_FILE_EXTENSIONS.contains(&file_ext)
        {
            pack.sounds.count += 1;
            dst_path = pack.sounds.path().join(&relative_to_data_path);
        } else if INTERFACE_FOLDERS.contains(&folder_name.as_str())
            && INTERFACE_FILE_EXTENSIONS.contains(&file_ext)
        {
            pack.interface.count += 1;
            dst_path = pack.interface.path().join(&relative_to_data_path);
            log::trace!("Sound file found: {file_name} in folder {folder_name}");
        } else if TEXTURES_FOLDERS.contains(&folder_name.as_str())
            && TEXTURES_FILE_EXTENSIONS.contains(&file_ext)
        {
            pack.textures.count += 1;
            dst_path = pack.textures.path().join(&relative_to_data_path);
            log::trace!("Texture file found: {file_name} in folder {folder_name}");
        } else if GENERAL_FOLDERS.contains(&folder_name.as_str())
            && GENERAL_FILE_EXTENSIONS.contains(&file_ext)
        {
            pack.general.count += 1;
            dst_path = pack.general.path().join(&relative_to_data_path);
            log::trace!("General file found: {file_name} in folder {folder_name}");
        } else if MISC_FOLDERS.contains(&folder_name.as_str())
            && MISC_FILE_EXTENSIONS.contains(&file_ext)
        {
            pack.misc.count += 1;
            dst_path = pack.misc.path().join(&relative_to_data_path);
            log::trace!("Miscellaneous file found: {file_name} in folder {folder_name}");
        } else {
            if relative_path == relative_to_data_path {
                // Assume that the file belongs in the Data folder:
                dst_path = pack.loose_files_path.join("Data").join(&relative_path);
            } else {
                dst_path = pack.loose_files_path.join(&relative_path);
            }
            log::trace!("Loose file found: {file_name} in folder {folder_name}");
        }

        if let Some(parent) = dst_path.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::copy(&file_path, &dst_path)?;
    }
    Ok(())
}

/// Pack each temporary folder from `pack` to an archive.
/// Puts the archives into `dst_path`.
fn pack_archives_from_temp_sorted<P: AsRef<Path>>(
    dst_path: P,
    pack: &ModPack,
) -> ModActionResult<()> {
    for archive in &[
        &pack.general,
        &pack.textures,
        &pack.sounds,
        &pack.interface,
        &pack.misc,
    ] {
        if archive.count > 0 {
            let ba2_archive = dst_path.as_ref().join("Data").join(archive.archive_name());
            let (format, compression) = archive.preset.into_format_and_compression();
            log::trace!(
                "Packing archive {} with format {:?} and compression {:?}",
                archive.archive_name(),
                format,
                compression
            );
            fs::create_dir_all(dst_path.as_ref().join("Data"))?;
            archive2::create_archive2(ba2_archive, archive.path(), format, compression)?;
        }
    }
    Ok(())
}

/// Moves loose files from `pack.loose_files_path` into `dst_path`, if the folder exists.
fn move_loose_files_from_temp_sorted<P: AsRef<Path>>(
    dst_path: P,
    pack: &ModPack,
) -> ModActionResult<()> {
    if !pack.loose_files_path.exists() {
        log::trace!(
            "Skipping copying loose files, {:?} does not exist",
            pack.loose_files_path,
        );
        return Ok(());
    }
    log::trace!(
        "Copying loose files from {:?} to {:?}",
        pack.loose_files_path,
        dst_path.as_ref()
    );
    Ok(fs_util::copy_dir_all(
        &pack.loose_files_path,
        dst_path.as_ref(),
        fs_util::CopyMethod::Copy,
    )?)
}
