use std::path::Path;

use anyhow::Result;
use tap::TapFallible;

use crate::{
    features::screenshots::{IMAGE_FILE_EXTENSIONS, Screenshot, thumbnails::create_thumbnail_safe},
    utils::fs_util,
};

/// Searches the Steam screenshot folder for screenshots:
/// * `C:\Program Files (x86)\Steam\userdata\<user id>\760\remote\1151340\screenshots\*.jpg`
/// * `C:\Program Files (x86)\Steam\userdata\<user id>\760\remote\1151340\screenshots\thumbnails\*.jpg`
pub fn get_steam_screenshots<P: AsRef<Path>>(screenshot_folder: P) -> Result<Vec<Screenshot>> {
    let screenshots =
        fs_util::list_files_with_static_exts(screenshot_folder.as_ref(), IMAGE_FILE_EXTENSIONS)
            .tap_err(|err| {
                log::error!("Couldn't get folder contents of Steam screenshots folder: {err}")
            })?
            .map(|path| Screenshot {
                thumbnail_path: create_thumbnail_safe(
                    &path,
                    path.parent().map(|p| p.join("thumbnails")).as_ref(),
                    None,
                ),
                path,
            })
            .collect();
    Ok(screenshots)
}
