use itertools::Itertools;
use std::path::PathBuf;
use std::{iter, path::Path};

use crate::features::steam::paths::{find_steam_installation_folders, get_steam_library_folders};

pub fn validate_game_path<P: AsRef<Path>>(path: P) -> bool {
    let path = path.as_ref();
    path.is_dir()
        && path.join("Data").is_dir()
        && path.join("Data").join("SeventySix.esm").is_file()
}

#[cfg(target_os = "windows")]
pub fn detect_game_path_for_platform() -> Vec<PathBuf> {
    use crate::utils::windows::drives::get_filtered_drives;

    let mut found: Vec<PathBuf> = Vec::new();
    for drive in get_filtered_drives() {
        for folders in [
            r"Program Files\ModifiableWindowsApps\Fallout 76",
            r"XboxGames\Fallout 76\Content",
            r"Program Files (x86)\Steam\steamapps\common\Fallout76",
            r"SteamLibrary\steamapps\common\Fallout76",
            r"SteamLibrary\steamapps\common\Fallout 76 Playtest",
        ] {
            let path = Path::new(&drive.path).join(folders);
            if validate_game_path(&path) {
                found.push(path);
            }
        }
    }
    found
}

#[cfg(target_os = "linux")]
pub fn detect_game_path_for_platform() -> Vec<PathBuf> {
    // Steam is handled by `detect_game_path`
    Vec::new()
}

#[cfg(target_os = "macos")]
pub fn detect_game_path_for_platform() -> Vec<PathBuf> {
    // Steam is handled by `detect_game_path`
    Vec::new()
}

pub fn detect_game_path() -> Vec<PathBuf> {
    // Get all possible Steam client installation directories:
    let steam_paths = find_steam_installation_folders().unwrap_or_default();

    // Get additional Steam library directories (e.g. when adding another hard drive etc.):
    let steam_library_paths = steam_paths
        .clone()
        .into_iter()
        .flat_map(|steam_path| get_steam_library_folders(steam_path).unwrap_or_default());

    // Chain it all together to find possible game and PTS installation directories:
    let possible_game_paths = iter::empty()
        .chain(steam_paths)
        .chain(steam_library_paths)
        .flat_map(|library_folder| {
            vec![
                Path::new(&library_folder)
                    .join("steamapps")
                    .join("common")
                    .join("Fallout76"),
                Path::new(&library_folder)
                    .join("steamapps")
                    .join("common")
                    .join("Fallout 76 Playtest"),
            ]
        });

    // Check if the possible paths actually contain a valid game installation:
    possible_game_paths
        .filter(|path| validate_game_path(path))
        .chain(detect_game_path_for_platform())
        .unique()
        .collect()
}
