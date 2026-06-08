use std::path::{Path, PathBuf};

use super::game_installation::validate_game_path;

/// Attempts to get the ini path based on the game path.
/// (The game path is only used on Linux.)
pub fn detect_ini_path<P: AsRef<Path>>(game_path: Option<P>) -> Option<PathBuf> {
    if cfg!(target_os = "linux")
        && let Some(game_path) = game_path
        && validate_game_path(game_path.as_ref())
    {
        // On Linux, try to guess the ini path (inside wine prefix) based on the game path:
        // Game path:   .../steamapps/common/Fallout76
        // Wine prefix: .../steamapps/compatdata/1151340/pfx
        // ini path:    .../steamapps/compatdata/1151340/pfx/drive_c/users/steamuser/Documents/My Games/Fallout 76

        let is_pts = game_path
            .as_ref()
            .file_name()
            .and_then(|s| s.to_str())
            .unwrap_or_default()
            .contains("Playtest");

        let steam_id = if is_pts { "1836200" } else { "1151340" };

        if let Some(ini_path) = game_path
            .as_ref()
            .parent()
            .and_then(|p| p.parent())
            .map(|p| {
                p.join(format!(
                "compatdata/{steam_id}/pfx/drive_c/users/steamuser/Documents/My Games/Fallout 76"
            ))
            })
            && ini_path.is_dir()
        {
            return Some(ini_path);
        }
    }

    // Get the path to `$env:UserProfile\Documents\My Games\Fallout 76` (or equivalent):
    dirs::document_dir().map(|documents| documents.join("My Games").join("Fallout 76"))
}

/// Attempt to detect the ini prefix by looking at the available ini files in the given path.
pub fn detect_ini_prefix<P: AsRef<Path>>(ini_path: Option<P>) -> &'static str {
    if let Some(ini_path) = ini_path
        && ini_path.as_ref().join("Project76.ini").is_file()
    {
        "Project76"
    } else {
        "Fallout76"
    }
}
