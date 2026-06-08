#[cfg(test)]
pub mod tests;

use std::ffi::{OsStr, OsString};
use std::io;
use std::path::{Path, PathBuf};

use duct;
use tap::{Tap, TapFallible};
use thiserror::Error;
use which::which;

use crate::osstring_concat;
use crate::utils::{fs_util, paths::get_resources_path};

/// Note: 7za does not support unpacking rar archives. Only 7z does.
pub const SUPPORTED_ARCHIVE_EXTENSIONS: &[&str] = &["7z", "zip", "rar", "tar", "xz", "gz", "bz2"];

pub type SevenzipResult<T> = Result<T, SevenzipError>;

#[derive(Error, Debug, strum::AsRefStr)]
pub enum SevenzipError {
    #[error("Couldn't find 7z")]
    SevenzipNotFound,
    #[error(transparent)]
    Io(#[from] io::Error),
    #[error("Command completed successfully but destination `{0}` doesn't exist")]
    DestinationNotFound(String),
}

fn get_7z_path() -> Option<PathBuf> {
    match which("7z")
        .or_else(|_| which("7za"))
        .or_else(|_| which("7zz"))
        .or_else(|_| which("p7zip"))
    {
        Ok(path) => {
            log::trace!("Found 7z in PATH: {path:?}");
            return Some(path);
        }
        Err(e) if !matches!(e, which::Error::CannotFindBinaryPath) => {
            log::error!("Error while searching for 7z: {e:?}");
        }
        _ => {}
    }

    if cfg!(target_os = "windows") {
        let resources_path = get_resources_path()?;
        let local_path = vec![
            resources_path.join("7z").join("7z.exe"),
            resources_path.join("7z").join("7za.exe"),
        ]
        .into_iter()
        .map(|p| p.canonicalize().unwrap_or(p))
        .find(|p| p.is_file());

        if let Some(path) = local_path {
            log::trace!("Found included 7z: {path:?}");
            return Some(path);
        }
    }

    None
}

fn get_unrar_path() -> Option<PathBuf> {
    which("unrar")
        .tap(|path| log::trace!("Found unrar in PATH: {path:?}"))
        .tap_err(|e| {
            if !matches!(e, which::Error::CannotFindBinaryPath) {
                log::error!("Error while searching for unrar: {e:?}");
            }
        })
        .ok()
}

fn sevenzip_cmd<U>(args: U) -> SevenzipResult<duct::Expression>
where
    U: IntoIterator,
    U::Item: Into<OsString>,
{
    match get_7z_path() {
        Some(path) => Ok(duct::cmd(path, args)),
        None => Err(SevenzipError::SevenzipNotFound),
    }
}

/// Extracts an archive (.7z, .zip, .tar, ...) into the given destination folder.
pub fn extract_archive<P: AsRef<Path>>(source: P, destination: P) -> SevenzipResult<()> {
    let (source, destination) = (source.as_ref(), destination.as_ref());
    let extension = source
        .extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| ext.to_string())
        .unwrap_or_default()
        .to_lowercase();

    // On Linux, use `unrar` for rar archives:
    // (unsure if there's an "unrar" on Windows...)
    if extension == "rar"
        && let Some(unrar_path) = get_unrar_path()
    {
        let cmd = duct::cmd!(unrar_path, "x", source, "-y", destination);
        log::trace!("unrar cmd: {:?}", cmd);
        let output = cmd.read()?;
        log::trace!("unrar output: {}", output);
        if !destination.exists() || fs_util::is_empty(destination)? {
            return Err(SevenzipError::DestinationNotFound(
                destination.to_string_lossy().to_string(),
            ));
        }
        log::trace!("unrar success");
    } else {
        let cmd = sevenzip_cmd(vec![
            OsStr::new("x"),
            source.as_ref(),
            OsStr::new("-y"),
            &osstring_concat!(OsStr::new("-o"), destination.as_ref()),
        ])?;
        log::trace!("7z cmd: {:?}", cmd);
        let output = cmd.read()?;
        log::trace!("7z output: {}", output);
        if !destination.exists() || fs_util::is_empty(destination)? {
            return Err(SevenzipError::DestinationNotFound(
                destination.to_string_lossy().to_string(),
            ));
        }
        log::trace!("7z success");
    }

    Ok(())
}
