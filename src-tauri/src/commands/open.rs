use std::fs;
use std::path::{Path, PathBuf};

use anyhow::Result;
use serde::{Deserialize, Serialize};
use specta::Type;
use tap::{Tap, TapFallible};

use crate::{
    commands::errors::{CommandError, CommandResult},
    features::steam::paths::{find_steam_installation_folders, get_steam_screenshots_folders},
    utils::{
        open::open_path,
        paths::{
            get_config_path, get_current_log_file_path, get_install_path,
            get_translation_folder_path,
        },
    },
};

#[tauri::command]
#[specta::specta]
pub fn open_path_in_file_explorer(path: &str) -> CommandResult<()> {
    if Path::new(path).exists() {
        open_path(path)
            .tap_err(|e| log::error!("Couldn't open path: {e}"))
            .map_err(CommandError::from)
    } else {
        Err(CommandError::from(
            format!("Path doesn't exist: {path}").tap(|s| log::error!("{s}")),
        ))
    }
}

// Opens the current log file with the default program.
#[tauri::command]
#[specta::specta]
pub fn open_log_file() -> CommandResult<()> {
    if let Some(path) = get_current_log_file_path() {
        let path: camino::Utf8PathBuf = path.try_into()?;
        if path.exists() {
            open_path(path.as_ref())
                .tap_err(|e| log::error!("Couldn't open path: {e}"))
                .map_err(CommandError::from)
        } else {
            let err = format!("Path doesn't exist: {path}");
            log::error!("{err}");
            Err(CommandError::from(err))
        }
    } else {
        let err = "Path couldn't be determined";
        log::error!("{err}");
        Err(CommandError::from(err))
    }
}

#[derive(Serialize, Deserialize, Type, Debug)]
pub enum SpecialPath {
    AppInstallFolder,
    AppConfigFolder,
    AppTranslationsFolder,
    SteamScreenshotFolder,
}

#[tauri::command]
#[specta::specta]
pub fn open_special_path(special_path: SpecialPath) -> CommandResult<()> {
    let map_result = |path: Result<PathBuf>| {
        path.tap_err(|e| log::error!("Couldn't determine path for {:?}: {e}", special_path))
            .map_err(CommandError::from)
    };

    let map_option = |path: Option<PathBuf>| {
        path.ok_or(format!("Couldn't determine path for {:?}", special_path))
            .tap_err(|e| log::error!("{e}"))
            .map_err(CommandError::from)
    };

    let create_it = |path: PathBuf| {
        if !path.exists() {
            fs::create_dir_all(&path)
                .tap_err(|e| log::error!("Couldn't create folder {path:?}: {e}"))
                .map_err(CommandError::from)?;
        }
        Ok(path)
    };

    let open_it = |path: PathBuf| {
        if !path.exists() {
            Err(CommandError::from(
                format!("Path doesn't exist: {:?}", path).tap(|s| log::error!("{s}")),
            ))?
        }
        open_path(
            path.to_str()
                .ok_or("Path couldn't be converted to string.".to_string())
                .tap_err(|e| log::error!("{e}"))
                .map_err(CommandError::from)?,
        )
        .tap_err(|e| log::error!("Couldn't open path: {e}"))
        .map_err(CommandError::from)
    };

    match special_path {
        SpecialPath::AppInstallFolder => map_result(get_install_path()).and_then(open_it),
        SpecialPath::AppConfigFolder => map_option(get_config_path()).and_then(open_it),
        SpecialPath::AppTranslationsFolder => map_option(get_translation_folder_path())
            .and_then(create_it)
            .and_then(open_it),
        SpecialPath::SteamScreenshotFolder => map_option(
            // TODO: Open multiple? Handle errors?
            find_steam_installation_folders()
                .ok()
                .and_then(|steam_paths| steam_paths.first().cloned())
                .and_then(|steam_path| get_steam_screenshots_folders(steam_path).ok())
                .and_then(|screenshot_paths| screenshot_paths.first().cloned()),
        )
        .and_then(open_it),
    }
}
