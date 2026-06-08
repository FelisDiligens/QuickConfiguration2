use anyhow::Result;
use std::{fs, path::Path};
use tap::TapFallible;

use crate::{
    features::screenshots::{IMAGE_FILE_EXTENSIONS, Screenshot, thumbnails::create_thumbnail_safe},
    utils::{fs_util, paths::get_legacy_config_path},
};

const IGNORE_IMAGES: &[&str] = &[
    "LiveLogo.png",
    "SmallLogo.png",
    "SplashScreen.png",
    "StoreLogo.png",
    "WideLogo.png",
];

/// Searches and returns screenshots from the game path.
pub fn get_game_screenshots<P: AsRef<Path>>(
    game_path: P,
    thumbnail_folder: Option<P>,
) -> Result<Vec<Screenshot>> {
    // Create (legacy) thumbnails folder:
    let thumbnail_folder = thumbnail_folder
        .map(|p| p.as_ref().to_path_buf())
        .unwrap_or_else(|| {
            get_legacy_config_path()
                .map(|p| p.join("thumbnails").join("screenshots"))
                .unwrap_or(game_path.as_ref().join("thumbnails"))
        });
    fs::create_dir_all(&thumbnail_folder)
        .tap_err(|err| log::error!("Couldn't create thumbnails folder: {err}"))?;

    // List all screenshots and create a thumbnail for each of them:
    let screenshots = fs_util::list_files_with_static_exts(game_path, IMAGE_FILE_EXTENSIONS)
        .tap_err(|err| log::error!("Couldn't get directory entries for game path: {err}"))?
        .filter(|path| {
            !IGNORE_IMAGES.contains(
                &path
                    .file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .as_ref(),
            )
        })
        .map(|path| Screenshot {
            thumbnail_path: create_thumbnail_safe(&path, Some(&thumbnail_folder), None),
            path,
        })
        .collect();

    Ok(screenshots)
}

/// Searches and returns photos from the ini parent path.
pub fn get_game_photos<P: AsRef<Path>>(ini_path: P) -> Result<Vec<Screenshot>> {
    let mut photos = Vec::new();

    // $env:UserProfile\Documents\My Games\Fallout 76\Photos\<UUID>\*.png and *-thumbnail.png
    for photos_path in fs_util::list_directories(ini_path.as_ref().join("Photos"))
        .tap_err(|err| log::error!("Couldn't get directory entries for `Photos` folder: {err}"))?
    {
        photos.extend(
            fs_util::list_files_with_static_exts(&photos_path, IMAGE_FILE_EXTENSIONS)
                .tap_err(|err| {
                    log::error!("Couldn't get directory entries for `Photos` subdirectory: {err}")
                })?
                .map(|path| Screenshot {
                    thumbnail_path: create_thumbnail_safe(
                        &path,
                        Some(&photos_path),
                        Some("-thumbnail"),
                    ),
                    path,
                }),
        )
    }
    Ok(photos)
}
