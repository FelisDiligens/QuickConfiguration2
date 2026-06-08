//! Pertains to v1 config.ini

use std::{fs, str::FromStr};

use ini::Ini;

use crate::utils::ini::{IniAccessors, escape_windows_path_separators};
use crate::utils::paths::get_legacy_config_file_path;

#[derive(strum::FromRepr, Debug, PartialEq)]
pub enum LegacyModListStyle {
    Standard = 0,
    Alternative = 1,
}

#[derive(strum::FromRepr, Debug, PartialEq)]
pub enum LegacyBundledLoadOrder {
    PutFirst = 0,
    PutLast = 1,
}

#[derive(strum::EnumString, Debug, PartialEq)]
pub enum LegacyThemeType {
    Dark,
    Light,
    System,
}

/// `[Mods]`
#[derive(Debug, PartialEq)]
pub struct LegacyConfigMods {
    /// `bUseHardlinks`
    /// Reduces disk space and deployment time.
    pub use_hard_links: bool,
    /// `bUseSymlinks`
    pub use_sym_links: bool,
    /// `bUnpackBA2ByDefault`
    pub unpack_ba2_by_default: bool,
    /// `bFreezeBundledArchives`
    pub freeze_bundled_archives: bool,
    /// `bShowRemoteModNames`
    pub show_remote_mod_names: bool,
    /// `iModListStyle`
    pub mod_list_style: LegacyModListStyle,
    /// `iEnumBundledLoadOrderPreference`
    /// Where to put the bundled archives in the load order? First or last?
    pub bundled_load_order: LegacyBundledLoadOrder,
    /// `sResourceListName`
    pub resource_list_name: String,
}

impl Default for LegacyConfigMods {
    fn default() -> Self {
        Self {
            use_hard_links: true,
            use_sym_links: true,
            unpack_ba2_by_default: false,
            freeze_bundled_archives: false,
            show_remote_mod_names: false,
            mod_list_style: LegacyModListStyle::Standard,
            bundled_load_order: LegacyBundledLoadOrder::PutFirst,
            resource_list_name: "sResourceArchive2List".to_string(),
        }
    }
}

impl LegacyConfigMods {
    pub fn read(ini: &Ini) -> Self {
        Self {
            use_hard_links: ini.bool(Some("Mods"), "bUseHardlinks").unwrap_or(true),
            use_sym_links: ini.bool(Some("Mods"), "bUseSymlinks").unwrap_or(true),
            unpack_ba2_by_default: ini
                .bool(Some("Mods"), "bUnpackBA2ByDefault")
                .unwrap_or(false),
            freeze_bundled_archives: ini
                .bool(Some("Mods"), "bFreezeBundledArchives")
                .unwrap_or(false),
            show_remote_mod_names: ini
                .bool(Some("Mods"), "bShowRemoteModNames")
                .unwrap_or(false),
            mod_list_style: ini
                .usize(Some("Mods"), "iModListStyle")
                .and_then(LegacyModListStyle::from_repr)
                .unwrap_or(LegacyModListStyle::Standard),
            bundled_load_order: ini
                .usize(Some("Mods"), "iEnumBundledLoadOrderPreference")
                .and_then(LegacyBundledLoadOrder::from_repr)
                .unwrap_or(LegacyBundledLoadOrder::PutFirst),
            resource_list_name: ini
                .string(Some("Mods"), "sResourceListName")
                .unwrap_or_else(|| "sResourceArchive2List".to_string()),
        }
    }
}

/// `[NuclearWinter]`
#[derive(Debug, PartialEq)]
pub struct LegacyConfigNuclearWinter {
    /// `bShowNWModeBtn`
    pub show_nw_mode_btn: bool,
    /// `bAutoDisableMods`
    pub auto_disable_mods: bool,
    /// `bAutoDeployMods`
    pub auto_deploy_mods: bool,
    /// `bRenameDLLs`
    pub rename_dlls: bool,
}

impl Default for LegacyConfigNuclearWinter {
    fn default() -> Self {
        Self {
            show_nw_mode_btn: false,
            auto_disable_mods: true,
            auto_deploy_mods: true,
            rename_dlls: true,
        }
    }
}

impl LegacyConfigNuclearWinter {
    pub fn read(ini: &Ini) -> Self {
        Self {
            show_nw_mode_btn: ini
                .bool(Some("NuclearWinter"), "bShowNWModeBtn")
                .unwrap_or(false),
            auto_disable_mods: ini
                .bool(Some("NuclearWinter"), "bAutoDisableMods")
                .unwrap_or(true),
            auto_deploy_mods: ini
                .bool(Some("NuclearWinter"), "bAutoDeployMods")
                .unwrap_or(true),
            rename_dlls: ini
                .bool(Some("NuclearWinter"), "bRenameDLLs")
                .unwrap_or(true),
        }
    }
}

/// `[Gallery]`
#[derive(Debug, PartialEq, Default)]
pub struct LegacyConfigGallery {
    /// `bSearchDirectoriesRecursively`
    pub search_dirs_recursively: bool,
    /// `sCustomPathsList`
    pub custom_paths: Vec<String>,
}

impl LegacyConfigGallery {
    pub fn read(ini: &Ini) -> Self {
        Self {
            search_dirs_recursively: ini
                .bool(Some("Gallery"), "bSearchDirectoriesRecursively")
                .unwrap_or(false),
            custom_paths: ini
                .string(Some("Gallery"), "sCustomPathsList")
                .map(|v| {
                    v.split(',')
                        .map(|s| s.trim().to_owned())
                        .filter(|s| !s.is_empty())
                        .collect()
                })
                .unwrap_or_default(),
        }
    }
}

/// `[NexusMods]`
#[derive(Debug, PartialEq)]
pub struct LegacyConfigNexusMods {
    /// `bAutoUpdateProfile`
    pub auto_update_profile: bool,
    /// `bDownloadThumbnailsOnUpdate`
    pub download_thumbnails_on_update: bool,
}

impl Default for LegacyConfigNexusMods {
    fn default() -> Self {
        Self {
            auto_update_profile: true,
            download_thumbnails_on_update: true,
        }
    }
}

impl LegacyConfigNexusMods {
    pub fn read(ini: &Ini) -> Self {
        Self {
            auto_update_profile: ini
                .bool(Some("NexusMods"), "bAutoUpdateProfile")
                .unwrap_or(true),
            download_thumbnails_on_update: ini
                .bool(Some("NexusMods"), "bDownloadThumbnailsOnUpdate")
                .unwrap_or(true),
        }
    }
}

/// `[Translations]`
#[derive(Debug, PartialEq)]
pub struct LegacyConfigLocalization {
    /// `sLastUpdated`
    /// Formatted using RFC3339
    pub translations_last_updated: String,
    /// `[Preferences]sLanguage`
    pub selected_language: String,
    /// `bNotifyAboutAvailableUpdates`
    pub notify_about_available_updates: bool,
}

impl Default for LegacyConfigLocalization {
    fn default() -> Self {
        Self {
            translations_last_updated: "2022-09-01T00:00:00Z".to_string(),
            selected_language: "".to_string(),
            notify_about_available_updates: true,
        }
    }
}

impl LegacyConfigLocalization {
    pub fn read(ini: &Ini) -> Self {
        Self {
            translations_last_updated: ini
                .string(Some("Translations"), "sLastUpdated")
                .unwrap_or_else(|| "2022-09-01T00:00:00Z".to_string()),
            selected_language: ini
                .string(Some("Preferences"), "sLanguage")
                .unwrap_or_default(),
            notify_about_available_updates: ini
                .bool(Some("Translations"), "bNotifyAboutAvailableUpdates")
                .unwrap_or(true),
        }
    }
}

/// `[Appearance]`
#[derive(Debug, PartialEq)]
pub struct LegacyConfigAppearance {
    /// `sAppTheme`
    pub app_theme: LegacyThemeType,
}

impl Default for LegacyConfigAppearance {
    fn default() -> Self {
        Self {
            app_theme: LegacyThemeType::System,
        }
    }
}

impl LegacyConfigAppearance {
    pub fn read(ini: &Ini) -> Self {
        Self {
            app_theme: ini
                .string(Some("Appearance"), "sAppTheme")
                .and_then(|v| LegacyThemeType::from_str(&v).ok())
                .unwrap_or(LegacyThemeType::System),
        }
    }
}

#[derive(Debug, PartialEq)]
pub struct LegacyConfig {
    pub mods: LegacyConfigMods,
    pub nuclear_winter: LegacyConfigNuclearWinter,
    pub gallery: LegacyConfigGallery,
    pub nexus_mods: LegacyConfigNexusMods,
    pub localization: LegacyConfigLocalization,
    pub appearance: LegacyConfigAppearance,
    /// `[General]sVersion`
    pub version: String,
    /// `[Preferences]bAutoApply`
    /// No need to press apply anymore.
    pub auto_apply: bool,
    /// `[Preferences]bQuitOnLaunch`
    /// When enabled, closes the tool when the game is launched.
    /// Only works if launched through the tool.
    pub quit_on_launch: bool,
    /// `[Preferences]bMakeBackups`
    /// Determines whether or not to create backups of *.ini files when the tool saves them.
    pub make_backups: bool,
    /// `[Preferences]bPlayNotificationSound`
    /// When enabled, the tool will play custom notification sounds.
    pub play_notification_sounds: bool,
    /// `[Preferences]bShowNotifications`
    pub show_notifications: bool,
    /// `[Preferences]bIgnoreUpdates`
    /// Won't check for updates on startup and hides the big update button.
    pub ignore_updates: bool,
    /// `[Preferences]sDownloadPath`
    /// When you download mods using the 'Vortex' / 'Mod Manager Download' button on NexusMods,
    /// the tool will download the file to this folder.
    pub download_path: String,
    /// `[Preferences]sArchiveTwoPath`
    /// The tool uses Archive2.exe to extract and pack *.ba2 files.
    /// You can set the path where the tool looks for Archive2.exe.
    pub archive2_path: String,
    /// `[Preferences]sSevenZipPath`
    /// The tool uses 7z.exe to extract various archives (zip, rar, 7z).
    /// You can set the path where the tool looks for 7z.exe.
    pub seven_zip_path: String,
}

impl Default for LegacyConfig {
    fn default() -> Self {
        Self {
            mods: LegacyConfigMods::default(),
            nuclear_winter: LegacyConfigNuclearWinter::default(),
            gallery: LegacyConfigGallery::default(),
            nexus_mods: LegacyConfigNexusMods::default(),
            localization: LegacyConfigLocalization::default(),
            appearance: LegacyConfigAppearance::default(),
            version: "".to_string(),
            auto_apply: true,
            quit_on_launch: false,
            make_backups: true,
            play_notification_sounds: true,
            show_notifications: true,
            ignore_updates: false,
            download_path: "".to_string(),
            archive2_path: "".to_string(),
            seven_zip_path: "".to_string(),
        }
    }
}

impl LegacyConfig {
    pub fn read(ini: &Ini) -> Self {
        Self {
            mods: LegacyConfigMods::read(ini),
            nuclear_winter: LegacyConfigNuclearWinter::read(ini),
            gallery: LegacyConfigGallery::read(ini),
            nexus_mods: LegacyConfigNexusMods::read(ini),
            localization: LegacyConfigLocalization::read(ini),
            appearance: LegacyConfigAppearance::read(ini),
            version: ini.string(Some("General"), "sVersion").unwrap_or_default(),
            auto_apply: ini.bool(Some("Preferences"), "bAutoApply").unwrap_or(true),
            quit_on_launch: ini
                .bool(Some("Preferences"), "bQuitOnLaunch")
                .unwrap_or(false),
            make_backups: ini
                .bool(Some("Preferences"), "bMakeBackups")
                .unwrap_or(true),
            play_notification_sounds: ini
                .bool(Some("Preferences"), "bPlayNotificationSound")
                .unwrap_or(true),
            show_notifications: ini
                .bool(Some("Preferences"), "bShowNotifications")
                .unwrap_or(true),
            ignore_updates: ini
                .bool(Some("Preferences"), "bIgnoreUpdates")
                .unwrap_or(false),
            download_path: ini
                .string(Some("Preferences"), "sDownloadPath")
                .unwrap_or_default(),
            archive2_path: ini
                .string(Some("Preferences"), "sArchiveTwoPath")
                .unwrap_or_default(),
            seven_zip_path: ini
                .string(Some("Preferences"), "sSevenZipPath")
                .unwrap_or_default(),
        }
    }
}

/// If config.ini exists, attempts to read it and returns either `Ok(Some(LegacyConfig))` or `Err(anyhow::Error)`.
/// If the file doesn't exist, returns `Ok(None)`.
pub fn get_legacy_config() -> anyhow::Result<Option<LegacyConfig>> {
    let path = get_legacy_config_file_path().expect("get the legacy config file path");
    if !path.exists() {
        Ok(None)
    } else {
        let contents = escape_windows_path_separators(fs::read_to_string(&path)?);
        let ini = Ini::load_from_str(&contents)?;
        let config = LegacyConfig::read(&ini);
        Ok(Some(config))
    }
}
