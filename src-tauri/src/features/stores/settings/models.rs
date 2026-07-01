use serde::{Deserialize, Serialize};
use specta::Type;

use super::legacy::LegacyConfig;
use crate::{
    features::stores::settings::legacy::LegacyThemeType, info::APP_VERSION, utils::fs_util,
};

#[derive(Debug, Serialize, Deserialize, PartialEq, Clone, Type)]
#[serde(rename_all = "lowercase")]
pub enum Theme {
    Light,
    Dark,
    System,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Clone, Type)]
#[serde(rename_all = "camelCase", default)]
pub struct Settings {
    pub version: String,
    pub theme: Theme,
    pub use_game_cursor: bool,
    pub language: Option<String>,
    #[specta(type = Option<String>)] // will be formatted as RFC3339
    pub translations_last_updated: Option<chrono::DateTime<chrono::Utc>>,
    pub fetch_server_status_on_start: bool,
    pub check_for_updates_on_start: bool,
    pub download_translations_on_start: bool,
    pub quit_on_game_launch: bool,
    pub navigation_collapsed: bool,
    pub mod_manager: ModManagerSettings,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub migrated_from_v1: Option<Migration>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prerelease_dismissed: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Clone, Type)]
#[serde(rename_all = "camelCase")]
#[specta(rename = "SettingsMigration")]
pub struct Migration {
    pub from_version: String,
    pub to_version: String,
    #[specta(type = String)] // will be formatted as RFC3339
    pub date: chrono::DateTime<chrono::Utc>,
    pub dismissed: bool,
}

/// Settings that only apply to the mod manager portion of the tool.
#[derive(Serialize, Deserialize, Debug, PartialEq, Clone, Type)]
#[serde(rename_all = "camelCase", default)]
pub struct ModManagerSettings {
    /// The resource list (e.g. "sResourceArchive2List") to use.
    pub resource_list: String,
    /// How to copy mod files.
    pub copy_method: ModCopyMethod,
    /// Where to put (new) mod resources in the order?
    pub resource_insertion_position: ResourceInsertionPosition,
    /// Does not overwrite existing config files and also does not remove them.
    pub keep_config_files: bool,
    /// Where to download mods to?
    pub download_path: String,
    /// Display NexusMods titles instead of mod names if available. User-preference.
    pub show_nexus_mods_title: bool,
}

#[derive(Serialize, Deserialize, Debug, PartialEq, Clone, Type)]
#[serde(rename_all = "lowercase")]
pub enum ModCopyMethod {
    Copy,
    Symlink,
    Hardlink,
}

impl From<ModCopyMethod> for fs_util::CopyMethod {
    fn from(value: ModCopyMethod) -> Self {
        match value {
            ModCopyMethod::Copy => Self::Copy,
            ModCopyMethod::Symlink => Self::Symlink,
            ModCopyMethod::Hardlink => Self::Hardlink,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, PartialEq, Clone, Type)]
#[serde(rename_all = "lowercase")]
pub enum ResourceInsertionPosition {
    Prepend,
    Append,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            version: APP_VERSION.to_owned(),
            theme: Theme::System,
            use_game_cursor: false,
            language: None,
            translations_last_updated: None,
            fetch_server_status_on_start: true,
            check_for_updates_on_start: true,
            download_translations_on_start: true,
            quit_on_game_launch: true,
            navigation_collapsed: false,
            mod_manager: ModManagerSettings::default(),
            migrated_from_v1: None,
            prerelease_dismissed: None,
        }
    }
}

impl Default for ModManagerSettings {
    fn default() -> Self {
        Self {
            resource_list: "sResourceArchive2List".to_string(),
            copy_method: ModCopyMethod::Hardlink,
            resource_insertion_position: ResourceInsertionPosition::Append,
            keep_config_files: true,
            download_path: dirs::download_dir()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string(),
            show_nexus_mods_title: true,
        }
    }
}

impl Settings {
    /// Creates a Settings struct with default values.
    pub fn new() -> Settings {
        Self::default()
    }
}

impl From<LegacyThemeType> for Theme {
    fn from(value: LegacyThemeType) -> Self {
        match value {
            LegacyThemeType::Dark => Theme::Dark,
            LegacyThemeType::Light => Theme::Light,
            LegacyThemeType::System => Theme::System,
        }
    }
}

impl From<LegacyConfig> for Settings {
    fn from(value: LegacyConfig) -> Self {
        Self {
            migrated_from_v1: Some(Migration {
                from_version: value.version,
                to_version: APP_VERSION.to_owned(),
                date: chrono::Utc::now(),
                dismissed: false,
            }),
            theme: value.appearance.app_theme.into(),
            language: value
                .localization
                .selected_language
                .split("-")
                .next()
                .map(|s| s.to_owned()),
            quit_on_game_launch: value.quit_on_launch,
            mod_manager: ModManagerSettings {
                resource_list: value.mods.resource_list_name,
                copy_method: if value.mods.use_hard_links {
                    ModCopyMethod::Hardlink
                } else if value.mods.use_sym_links {
                    ModCopyMethod::Symlink
                } else {
                    ModCopyMethod::Copy
                },
                download_path: if value.download_path.is_empty() {
                    dirs::download_dir()
                        .unwrap_or_default()
                        .to_string_lossy()
                        .to_string()
                } else {
                    value.download_path
                },
                show_nexus_mods_title: value.mods.show_remote_mod_names,
                ..Default::default()
            },
            ..Default::default()
        }
    }
}
