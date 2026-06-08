use std::{
    ffi::OsStr,
    fs,
    io::Cursor,
    path::{Path, PathBuf},
};

use image::ImageReader;
use reqwest::IntoUrl;

use crate::{info, osstring_concat};

/// Reads from image at `src_path`, creates a thumbnail, and writes image to `dst_path`
pub fn create_thumbnail<P: AsRef<Path>>(src_path: P, dst_path: P) -> anyhow::Result<()> {
    ImageReader::open(src_path)?
        .with_guessed_format()?
        .decode()?
        .thumbnail(250, 250)
        .save(dst_path)?;
    Ok(())
}

/// Downloads image from `src_url`, creates a thumbnail, and writes image to `dst_path`.
pub async fn create_thumbnail_from_url<U: IntoUrl, P: AsRef<Path>>(
    src_url: U,
    dst_path: P,
) -> anyhow::Result<()> {
    let resp = reqwest::Client::new()
        .get(src_url)
        .header("Application-Version", info::APP_VERSION)
        .header("Application-Name", info::APP_NAME)
        .header("User-Agent", info::user_agent())
        .send()
        .await?;
    let bytes = resp.bytes().await?;

    ImageReader::new(Cursor::new(bytes))
        .with_guessed_format()?
        .decode()?
        .thumbnail(250, 250)
        .save(dst_path)?;
    Ok(())
}

/// If `dst_dir` (folder) is given: reads from `src_path`, creates a thumbnail if needed and writes to folder `dst_dir`.
/// Appends file name to `dst_dir` to get `dst_path`, while optionally adding a suffix to the file name.
/// Returns `dst_path` (image file path) if given and creation was successfull, falls back to `src_path` otherwise.
pub fn create_thumbnail_safe<P: AsRef<Path>>(
    src_path: P,
    dst_dir: Option<P>,
    suffix: Option<&str>,
) -> PathBuf {
    // If no destination path is given, fallback to source path:
    let Some(dst_dir) = dst_dir else {
        return src_path.as_ref().to_path_buf();
    };

    // Determine image file name:
    let file_name = src_path.as_ref().file_name();
    // If file name couldn't be determined, fallback to source path:
    let Some(file_name) = file_name else {
        return src_path.as_ref().to_path_buf();
    };

    // Add suffix to file stem if given:
    let file_name = if let Some(stem) = src_path.as_ref().file_stem()
        && let Some(suffix) = suffix
        && let Some(ext) = src_path.as_ref().extension()
    {
        osstring_concat!(stem, OsStr::new(suffix), OsStr::new("."), ext)
    } else {
        file_name.to_owned()
    };

    // Create destination directory if it doesn't exist:
    if let Err(err) = fs::create_dir(dst_dir.as_ref()) {
        log::error!(
            "Couldn't create thumbnail destination folder `{:?}`: {}",
            dst_dir.as_ref(),
            err
        );
    }

    // Append image file name to destination path:
    let dst_path = dst_dir.as_ref().join(file_name);

    // If destination path exists, return it (nothing to do):
    if dst_path.is_file() {
        log::trace!(
            "Found thumbnail `{:?}` for `{:?}`.",
            dst_path,
            src_path.as_ref()
        );
        return dst_path;
    }

    // Make the thumbnail:
    match create_thumbnail(src_path.as_ref(), dst_path.as_ref()) {
        Ok(_) => {
            log::trace!(
                "Created thumbnail `{:?}` for `{:?}`.",
                dst_path,
                src_path.as_ref()
            );
            dst_path
        }
        Err(err) => {
            log::error!(
                "Couldn't create thumbnail for `{:?}`: {}",
                src_path.as_ref(),
                err
            );
            // Fallback to source path on error:
            src_path.as_ref().to_path_buf()
        }
    }
}
