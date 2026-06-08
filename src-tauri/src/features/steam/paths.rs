use anyhow::{Result, anyhow, bail};
use itertools::Itertools;
use regex::Regex;
use std::{
    fs,
    path::{Path, PathBuf},
};
use tap::TapFallible;
use unescape::unescape;

use crate::utils::fs_util;

/// Tries to find all (existing) Steam client installation folders for the platform.
///
/// * On Windows, it will return `C:\Program Files (x86)\Steam` only.
/// * On Linux, it will look into unsandboxed, Flatpak and Snap installation paths.
/// * On macOS, it will try to find the native installation path as well as looking into all CrossOver bottles.
pub fn find_steam_installation_folders() -> Result<Vec<PathBuf>> {
    Ok(if cfg!(target_os = "windows") {
        Some(Path::new(r"C:\Program Files (x86)\Steam").to_path_buf())
            .into_iter()
            .filter(|p| p.is_dir())
            .collect()
    } else if cfg!(target_os = "linux") {
        let home_dir = dirs::home_dir()
            .ok_or(anyhow!("Couldn't get home folder"))
            .tap_err(|err| log::error!("{err}"))?;

        // Try to find the first match from several possible install locations:
        vec![
            ".local/share/Steam",                          // Usual path
            ".steam/steam",                                // Usually a symlink to above path
            ".var/app/com.valvesoftware.Steam/data/Steam", // Flatpak
            "snap/steam",                                  // Snap
            ".snap/data/Steam",                            // Snap
        ]
        .into_iter()
        .map(|p| home_dir.join(p))
        .map(|p| fs::canonicalize(&p).unwrap_or(p))
        .filter(|p| p.is_dir())
        .unique()
        .collect()
    } else if cfg!(target_os = "macos") {
        let home_dir = dirs::home_dir()
            .ok_or(anyhow!("Couldn't get home folder"))
            .tap_err(|err| log::error!("{err}"))?;

        // Find all CrossOver bottles:
        // e.g. ~/Library/Application Support/CrossOver/Bottles/Steam/drive_c/Program Files (x86)/Steam
        let crossover_bottles: Vec<PathBuf> = fs_util::list_directories(
            home_dir.join("Library/Application Support/CrossOver/Bottles"),
        )
        .ok()
        .into_iter()
        .flatten()
        .map(|path| path.join("drive_c/Program Files (x86)/Steam"))
        .collect();

        // Try to find the first match from several possible install locations:
        vec![
            "Library/Application Support/Steam", // Native
        ]
        .into_iter()
        .map(|p| home_dir.join(p))
        .chain(crossover_bottles)
        .filter(|p| p.is_dir())
        .collect()
    } else {
        bail!("Unsupported platform");
    })
}

/// Reads Steam's `libraryfolders.vdf` file (if found)
/// and extracts all Steam library folder paths with a regex.
///
/// This can be used to find the game's installation directory.
pub fn get_steam_library_folders<P: AsRef<Path>>(steam_path: P) -> Result<Vec<PathBuf>> {
    // Get the path to .../Steam/steamapps/libraryfolders.vdf
    let libraryfolders_path = steam_path
        .as_ref()
        .join("steamapps")
        .join("libraryfolders.vdf");

    let re = Regex::new(r#"\t*"path"\t*"(?<path>.*)""#)?;
    let mut libraries = Vec::new();
    if let Ok(file) = fs::read_to_string(libraryfolders_path)
        .tap_err(|err| log::error!("Couldn't read libraryfolders.vdf: {err}"))
    {
        // TODO: Consider if the path has to be converted from DOS to Unix for Wine/CrossOver.
        libraries.extend(
            re.captures_iter(&file)
                .filter_map(|c| unescape(&c["path"]))
                .map(|s| Path::new(&s).to_path_buf())
                .filter(|p| p.is_dir()),
        );
    }

    Ok(libraries)
}

/// Returns the path to the screenshot folders,
/// e.g. `C:\Program Files (x86)\Steam\userdata\<user id>\760\remote\1151340\screenshots`.
pub fn get_steam_screenshots_folders<P: AsRef<Path>>(steam_path: P) -> Result<Vec<PathBuf>> {
    let mut screenshot_folders = Vec::new();
    let userdata_path = steam_path.as_ref().join("userdata");
    let userdata_folders = fs_util::list_directories(userdata_path)
        .tap_err(|err| log::error!("Couldn't get folder contents of Steam userdata: {err}"))?;
    for userdata_folder in userdata_folders {
        let path = userdata_folder.join("760/remote/1151340/screenshots");
        if path.is_dir() {
            screenshot_folders.push(path);
        }
        let pts_path = userdata_folder.join("760/remote/1836200/screenshots");
        if pts_path.is_dir() {
            screenshot_folders.push(pts_path);
        }
    }
    Ok(screenshot_folders)
}
