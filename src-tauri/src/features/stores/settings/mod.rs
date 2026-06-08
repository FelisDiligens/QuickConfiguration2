pub mod legacy;
pub mod models;

#[cfg(test)]
pub mod tests;

use crate::features::stores::settings::legacy::get_legacy_config;
use crate::info::APP_VERSION;
use crate::utils::paths::get_config_file_path;

use anyhow::{Result, anyhow};
use std::fs::{self, File};
use std::io::Write;
use std::path::PathBuf;
use tap::TapFallible;

use models::Settings;

pub fn get_settings() -> Result<Settings> {
    let path = get_config_file_path().expect("get the settings file path");
    if !path.exists() {
        Ok(Settings::new())
    } else {
        let mut settings: Settings = serde_json::from_reader(File::open(path)?)?;
        settings.version = APP_VERSION.to_owned();
        Ok(settings)
    }
}

/// If (and only if) the new config.json doesn't exist yet, load the legacy config.ini and transfer settings to the new app.
/// Otherwise behaves the same as `get_settings`.
pub fn get_settings_with_legacy_migration() -> Result<Settings> {
    let path = get_config_file_path().expect("get the settings file path");
    if !path.exists() {
        let legacy_config = get_legacy_config()
            .tap_err(|e| log::error!("Couldn't load legacy config.ini: {e}"))
            .ok()
            .flatten();
        match legacy_config {
            Some(legacy_config) => {
                log::trace!(
                    "[get_settings_with_legacy_migration] Loaded config.ini and transferred settings."
                );
                Ok(Settings::from(legacy_config))
            }
            None => Ok(Settings::new()),
        }
    } else {
        let mut settings: Settings = serde_json::from_reader(File::open(path)?)?;
        settings.version = APP_VERSION.to_owned();
        Ok(settings)
    }
}

pub fn save_settings(settings: Settings) -> Result<()> {
    let path: PathBuf = get_config_file_path().ok_or(anyhow!("Couldn't get config path"))?;
    fs::create_dir_all(path.parent().ok_or(anyhow!("Couldn't get parent path"))?)?;
    let mut file = File::create(path)?;
    write!(file, "{}", serde_json::to_string_pretty(&settings)?)?;
    Ok(())
}
