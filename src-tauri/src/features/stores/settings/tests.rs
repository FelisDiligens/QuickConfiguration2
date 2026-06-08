#![cfg(test)]

use indoc::indoc;
use ini::Ini;

use crate::features::stores::settings::legacy::{
    LegacyBundledLoadOrder, LegacyConfig, LegacyThemeType,
};
use crate::utils::ini::escape_windows_path_separators;

use super::models::{Settings, Theme};

#[test]
fn read_settings_with_defaults() {
    // Should be able to read empty config file and return defaults:
    let settings: Settings = serde_json::from_str("{}").unwrap();
    assert_eq!(settings, Settings::new());
}

#[test]
fn read_settings_with_missing_fields() {
    // Should be able to read config file with missing fields and fill in defaults:
    let settings: Settings = serde_json::from_str(
        r#"{
            "theme": "light",
            "language": "abc"
        }"#,
    )
    .unwrap();
    let default_settings = Settings::new();

    assert_eq!(settings.theme, Theme::Light);
    assert_eq!(settings.use_game_cursor, default_settings.use_game_cursor);
    assert_eq!(settings.language, Some("abc".to_string()));
    assert_eq!(
        settings.fetch_server_status_on_start,
        default_settings.fetch_server_status_on_start
    );
    assert_eq!(
        settings.quit_on_game_launch,
        default_settings.quit_on_game_launch
    );
    assert_eq!(
        settings.navigation_collapsed,
        default_settings.navigation_collapsed
    );
}

#[test]
fn read_legacy_config_with_defaults() {
    let ini = Ini::new(); // New empty ini file
    let config = LegacyConfig::read(&ini);
    let default_config = LegacyConfig::default();

    // Reading an empty ini file should result in using the default values:
    assert_eq!(config, default_config);
}

#[test]
fn read_legacy_config() {
    let result = Ini::load_from_str(&escape_windows_path_separators(indoc! {"
        [General]
        sVersion=1.12.9
        sPreviousVersion=1.12.9

        [Preferences]
        sLanguage=de-DE
        bDPIWarningShown=0

        [Translations]
        sLastUpdated=2026-03-05T20:55:20Z

        [Appearance]
        sAppTheme=Light

        [FormMods]
        iLocationX=1504
        iLocationY=190
        iWidth=800
        iHeight=1083
        bMaximised=0

        [FormMods.OLV]
        sColumnWidths=32,300,110,220,24

        [Mods]
        bUseHardlinks=0
        bUseSymlinks=1
        iEnumBundledLoadOrderPreference=1
        sResourceListName=sResourceIndexFileList
        bShowRemoteModNames=0

        [Form1]
        iLocationX=1303
        iLocationY=411
        iWidth=900
        iHeight=650
        bMaximised=0
    "}));
    assert!(result.is_ok(), "{}", result.unwrap_err());

    let ini = result.unwrap();
    let config = LegacyConfig::read(&ini);

    assert_eq!(config.version, "1.12.9");
    assert_eq!(config.appearance.app_theme, LegacyThemeType::Light);
    assert_eq!(config.mods.use_hard_links, false);
    assert_eq!(config.mods.use_sym_links, true);
    assert_eq!(
        config.mods.bundled_load_order,
        LegacyBundledLoadOrder::PutLast
    );
    assert_eq!(config.mods.resource_list_name, "sResourceIndexFileList");
    assert_eq!(config.mods.show_remote_mod_names, false);
}

#[test]
fn read_legacy_config_v1_11() {
    let result = Ini::load_from_str(&escape_windows_path_separators(indoc! {r#"
        [Preferences]
        uGameEdition=4
        sGamePath=D:\XboxGames\Fallout 76\Content
        sGamePathMSStore=D:\XboxGames\Fallout 76\Content
        sLanguage=en-US
        sArchiveTwoPath=.\Archive2\Archive2.exe
        sSevenZipPath=.\7z\7z.exe
        sDownloadPath=C:\Users\username\Downloads

        [General]
        sVersion=1.11.4
        sPreviousVersion=1.11.4

        [Form1]
        iLocationX=845
        iLocationY=165
        iWidth=900
        iHeight=650
        bMaximised=0

        [Mods]
        bUseHardlinks=1
        bUseSymlinks=0
        iEnumBundledLoadOrderPreference=0

        [Updater]
        sInstallationPath=D:\Portable\v1.10.0_bin
        sAPI_ETag=W/"f325dd8cc47beddb16b1ad3509bc1a2befeccd79ab82e6a1c5b0e59f653d0af0"
        sTagName=v1.11.4
        sLastDownloadURL=https://github.com/FelisDiligens/Fallout76-QuickConfiguration/releases/download/v1.11.4/v1.11.4_bin.zip
        sLastDownloadFileName=v1.11.4_bin.zip

        [FormMods]
        iLocationX=189
        iLocationY=444
        iWidth=800
        iHeight=640
        bMaximised=1

        [FormMods.OLV]
        sColumnWidths=32,300,110,220

        [NuclearWinter]
        bRenameDLLs=1

        [Login]
        uActiveAccountProfile=0

        [Translations]
        sLastUpdated=2022-09-02T19:11:38Z
    "#}));
    assert!(result.is_ok(), "{}", result.unwrap_err());

    let ini = result.unwrap();
    let config = LegacyConfig::read(&ini);

    assert_eq!(config.localization.selected_language, "en-US");
    assert_eq!(config.download_path, r"C:\Users\username\Downloads");
    assert_eq!(config.version, "1.11.4");
    assert_eq!(config.mods.use_hard_links, true);
    assert_eq!(config.mods.use_sym_links, false);
    assert_eq!(
        config.mods.bundled_load_order,
        LegacyBundledLoadOrder::PutFirst
    );
}
