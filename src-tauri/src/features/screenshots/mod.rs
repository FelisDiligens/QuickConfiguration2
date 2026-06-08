pub mod thumbnails;

#[cfg(test)]
pub mod tests;

use anyhow::Result;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::{Path, PathBuf};
use tap::TapFallible;

use crate::features::{game, steam};

#[derive(Serialize, Deserialize, Debug, Type)]
#[serde(rename_all = "camelCase")]
pub struct Screenshot {
    pub path: PathBuf,
    pub thumbnail_path: PathBuf,
}

pub const IMAGE_FILE_EXTENSIONS: &[&str] =
    &["jpg", "jpeg", "png", "webp", "gif", "bmp", "jfif", "jxl"];

pub fn get_screenshots<P: AsRef<Path>>(
    game_path: Option<P>,
    ini_path: Option<P>,
) -> Result<Vec<Screenshot>> {
    let mut screenshots = Vec::new();

    // Get Steam screenshots:
    let steam_screenshots = steam::paths::find_steam_installation_folders()
        .unwrap_or_default()
        .into_iter()
        .filter_map(|steam_path| steam::paths::get_steam_screenshots_folders(steam_path).ok())
        .flatten()
        .filter_map(|steam_path| {
            steam::screenshots::get_steam_screenshots(&steam_path)
                .tap_err(|err| log::warn!("Couldn't get Steam screenshots in `get_screenshots` for path {steam_path:?}: {err}"))
                .ok()
        })
        .flatten();
    screenshots.extend(steam_screenshots);

    // Get game screenshots:
    if let Some(game_path) = game_path {
        match game::screenshots::get_game_screenshots(game_path, None) {
            Ok(mut result) => screenshots.append(&mut result),
            Err(err) => log::warn!("Couldn't get game screenshots in `get_screenshots`: {err}"),
        }
    }

    // Get game photo mode screenshots:
    if let Some(ini_path) = ini_path {
        match game::screenshots::get_game_photos(ini_path) {
            Ok(mut result) => screenshots.append(&mut result),
            Err(err) => log::warn!("Couldn't get game photos in `get_screenshots`: {err}"),
        }
    }

    Ok(screenshots)
}
