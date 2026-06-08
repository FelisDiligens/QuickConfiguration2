#[cfg(test)]
mod tests;

pub mod models;

use crate::utils::paths::{get_legacy_profiles_file_path, get_profiles_file_path};
use crate::utils::serde_xml::xml_from_file;

use anyhow::{Result, anyhow};
use models::{json, xml};
use std::fs::{self, File};
use std::io::Write;
use tap::TapFallible;

pub fn get_legacy_profiles() -> Result<Option<xml::Profiles>> {
    let path = get_legacy_profiles_file_path().expect("get the legacy profiles file path");
    if !path.exists() {
        Ok(None)
    } else {
        let profiles: xml::Profiles = xml_from_file(path)?;
        Ok(Some(profiles))
    }
}

pub fn get_profiles() -> Result<json::Profiles> {
    let path = get_profiles_file_path().expect("get the profiles file path");
    if !path.exists() {
        Ok(json::Profiles::new())
    } else {
        let profiles: json::Profiles = serde_json::from_reader(File::open(path)?)?;
        Ok(profiles)
    }
}

/// If (and only if) the new profiles.json doesn't exist yet, load the legacy profiles.json and convert them to the new format.
/// Otherwise behaves the same as `get_profiles`.
pub fn get_profiles_with_legacy_migration() -> Result<json::Profiles> {
    let path = get_profiles_file_path().expect("get the profiles file path");
    if !path.exists() {
        let legacy_profiles = get_legacy_profiles()
            .tap_err(|e| log::error!("Couldn't load legacy profiles.xml: {e}"))
            .ok()
            .flatten();
        match legacy_profiles {
            Some(legacy_profiles) => {
                log::trace!(
                    "[get_profiles_with_legacy_migration] Loaded profiles.xml and transferred them."
                );
                Ok(json::Profiles::from(legacy_profiles))
            }
            None => Ok(json::Profiles::new()),
        }
    } else {
        let profiles: json::Profiles = serde_json::from_reader(File::open(path)?)?;
        Ok(profiles)
    }
}

pub fn save_profiles(profiles: json::Profiles) -> Result<()> {
    let path = get_profiles_file_path().expect("get the profiles file path");
    fs::create_dir_all(path.parent().ok_or(anyhow!("Couldn't get parent path"))?)?;
    let mut file = File::create(path)?;
    write!(file, "{}", serde_json::to_string_pretty(&profiles)?)?;
    Ok(())
}
