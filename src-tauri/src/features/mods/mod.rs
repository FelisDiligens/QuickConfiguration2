use std::{
    fs::{self},
    path::{Path, PathBuf},
};

use crate::{
    features::mods::models::{json, xml},
    utils::{fs_util, serde_xml},
};

use anyhow::anyhow;

pub mod deployment;
pub mod errors;
pub mod installation;
pub mod legacy;
pub mod management;
pub mod models;
pub mod utils;

/// Legacy pre v1.9.0 metadata file: "Fallout76\Mods\manifest.xml".
/// Probably (hopefully?) not in use anymore.
pub fn get_legacy_pre_v1_9_mods_metadata_path<P: AsRef<Path>>(mods_path: P) -> PathBuf {
    mods_path.as_ref().join("manifest.xml")
}

/// Legacy v1.9.0 and later metadata file: "Fallout76\Mods\managed.xml".
pub fn get_legacy_mods_metadata_path<P: AsRef<Path>>(mods_path: P) -> PathBuf {
    mods_path.as_ref().join("managed.xml")
}

/// New v2 metadata file that stores metadata about installed and deployed mods.
pub fn get_mods_metadata_path<P: AsRef<Path>>(mods_path: P) -> PathBuf {
    mods_path.as_ref().join("mods.json")
}

/// Temporary directory for various mod operations (installation, creating archives, etc.).
pub fn get_mods_temp_path<P: AsRef<Path>>(mods_path: P) -> PathBuf {
    mods_path.as_ref().join("_tmp")
}

/// Loads legacy pre v1.9.0 metadata file that stores metadata about installed and deployed mods.
pub fn load_legacy_mods<P: AsRef<Path>>(mods_path: P) -> anyhow::Result<Option<xml::ManagedMods>> {
    let path = get_legacy_mods_metadata_path(mods_path);
    if !path.exists() {
        Ok(None)
    } else {
        let mods: xml::ManagedMods = serde_xml::xml_from_file(path)?;
        Ok(Some(mods))
    }
}

/// Loads legacy pre v1.9.0 metadata file that stores metadata about installed and deployed mods.
pub fn save_legacy_mods<P: AsRef<Path>>(
    mods_path: P,
    mods: &xml::ManagedMods,
) -> anyhow::Result<()> {
    let path = get_legacy_mods_metadata_path(mods_path);
    fs::create_dir_all(path.parent().ok_or(anyhow!("Couldn't get parent path"))?)?;
    fs_util::write_atomic(path, serde_xml::xml_to_string_pretty(mods)?)?;
    Ok(())
}

/// Loads metadata file that stores metadata about installed and deployed mods.
pub fn load_mods<P: AsRef<Path>>(mods_path: P) -> anyhow::Result<Option<json::ManagedMods>> {
    let path = get_mods_metadata_path(mods_path);
    if !path.exists() {
        Ok(None)
    } else {
        let content = fs::read_to_string(path)?;
        let mods: json::ManagedMods = serde_json::from_str(&content)?;
        Ok(Some(mods))
    }
}

/// Saves metadata file that stores metadata about installed and deployed mods.
pub fn save_mods<P: AsRef<Path>>(mods_path: P, mods: &json::ManagedMods) -> anyhow::Result<()> {
    let path = get_mods_metadata_path(mods_path);
    fs::create_dir_all(path.parent().ok_or(anyhow!("Couldn't get parent path"))?)?;
    fs_util::write_atomic(path, serde_json::to_string_pretty(mods)?)?;
    Ok(())
}
