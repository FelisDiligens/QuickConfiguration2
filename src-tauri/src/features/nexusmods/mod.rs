//! See https://app.swaggerhub.com/apis-docs/NexusMods/nexus-mods_public_api_params_in_form_data/1.0#/

#[cfg(test)]
pub mod tests;

pub mod api;
pub mod models;
pub mod nxm;
pub mod sso;

use anyhow::{Result, anyhow};
use std::fs::{self, File};
use std::io::Write;
use std::path::PathBuf;
use tap::TapFallible;

use crate::features::nexusmods::models::{json, xml};
use crate::utils::paths::{get_config_path, get_legacy_config_path};
use crate::utils::serde_xml::{xml_from_file, xml_to_file_pretty};

/* Paths */

pub fn get_legacy_nexusmods_profile_path() -> Option<PathBuf> {
    get_legacy_config_path().map(|config| config.join("nexusmods").join("account.xml"))
}

pub fn get_nexusmods_mod_info_path() -> Option<PathBuf> {
    get_config_path().map(|config| config.join("nexusmods").join("mods.json"))
}

pub fn get_legacy_nexusmods_mod_info_path() -> Option<PathBuf> {
    get_legacy_config_path().map(|config| config.join("nexusmods").join("mods.xml"))
}

pub fn get_legacy_nexusmods_thumbnails_path() -> Option<PathBuf> {
    get_legacy_config_path().map(|config| config.join("thumbnails").join("nexusmods"))
}

/* Loading and saving of legacy files */

pub fn load_legacy_account() -> Result<Option<xml::Account>> {
    let path = get_legacy_nexusmods_profile_path()
        .ok_or(anyhow!("Couldn't determine path to nexusmods/account.xml"))?;
    if !path.exists() {
        Ok(None)
    } else {
        let account: xml::Account = xml_from_file(path)?;
        Ok(Some(account))
    }
}

pub fn save_legacy_account(account: &xml::Account) -> Result<()> {
    let path: PathBuf = get_legacy_nexusmods_profile_path()
        .ok_or(anyhow!("Couldn't determine path to nexusmods/account.xml"))?;
    fs::create_dir_all(path.parent().ok_or(anyhow!("Couldn't get parent path"))?)?;
    xml_to_file_pretty(path, account)
}

pub fn delete_legacy_account() -> Result<()> {
    let path: PathBuf = get_legacy_nexusmods_profile_path()
        .ok_or(anyhow!("Couldn't determine path to nexusmods/account.xml"))?;
    fs::remove_file(&path)?;
    Ok(())
}

pub fn load_legacy_modinfos() -> Result<Option<xml::Mods>> {
    let path = get_legacy_nexusmods_mod_info_path()
        .ok_or(anyhow!("Couldn't determine path to nexusmods/mods.xml"))?;
    if !path.exists() {
        Ok(None)
    } else {
        let modinfos: xml::Mods = xml_from_file(path)?;
        Ok(Some(modinfos))
    }
}

pub fn save_legacy_modinfos(modinfos: &xml::Mods) -> Result<()> {
    let path = get_legacy_nexusmods_mod_info_path()
        .ok_or(anyhow!("Couldn't determine path to nexusmods/mods.xml"))?;
    fs::create_dir_all(path.parent().ok_or(anyhow!("Couldn't get parent path"))?)?;
    xml_to_file_pretty(path, modinfos)
}

/* Loading and saving of files */

pub fn get_account() -> Result<Option<json::AccountInfo>> {
    if let Some(account) = load_legacy_account()? {
        Ok(Some(account.try_into()?))
    } else {
        Ok(None)
    }
}

pub fn set_account(account_info: json::AccountInfo) -> Result<()> {
    let account: xml::Account = account_info.into();
    save_legacy_account(&account)?;
    Ok(())
}

/// If (and only if) the new mods.json doesn't exist yet, load the legacy mods.xml and convert them to the new format.
pub fn get_modinfos() -> Result<Option<json::ModInfos>> {
    let path = get_nexusmods_mod_info_path()
        .ok_or(anyhow!("Couldn't determine path to nexusmods/mods.json"))?;
    if !path.exists() {
        if let Some(modinfos) =
            load_legacy_modinfos().tap_err(|e| log::error!("Couldn't load legacy mods.xml: {e}"))?
        {
            Ok(Some(modinfos.try_into()?))
        } else {
            Ok(None)
        }
    } else {
        let modinfos: json::ModInfos = serde_json::from_reader(File::open(path)?)?;
        Ok(Some(modinfos))
    }
}

pub fn set_modinfos(modinfos: json::ModInfos) -> Result<()> {
    let path = get_nexusmods_mod_info_path()
        .ok_or(anyhow!("Couldn't determine path to nexusmods/mods.json"))?;
    fs::create_dir_all(path.parent().ok_or(anyhow!("Couldn't get parent path"))?)?;
    let mut file = File::create(path)?;
    write!(file, "{}", serde_json::to_string_pretty(&modinfos)?)?;
    Ok(())
}
