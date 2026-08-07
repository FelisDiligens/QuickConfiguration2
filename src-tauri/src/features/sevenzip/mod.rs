#[cfg(test)]
pub mod tests;

use std::ffi::OsStr;
use std::io;
use std::path::{Path, PathBuf};

use duct;
use regex::Regex;
use tap::{TapFallible, TapOptional};
use thiserror::Error;
use which::which;

use crate::osstring_concat;
use crate::utils::{fs_util, paths::get_resources_path};

/// Note: 7za does not support unpacking rar archives. Only 7z does.
/// Also, 7z unfortunately doesn't extract compressed tarballs (`*.tar.[xz|gz|bz2|zstd]`) in one go. So I removed them for the list for now.
pub const SUPPORTED_ARCHIVE_EXTENSIONS: &[&str] = &["7z", "zip", "rar", "tar"]; // "xz", "gz", "bz2", "zst", "zstd"

pub type SevenzipResult<T> = Result<T, SevenzipError>;

#[derive(Error, Debug, strum::AsRefStr)]
pub enum SevenzipError {
    #[error("Couldn't find 7z")]
    SevenzipNotFound,
    #[error("RAR archives are not supported")]
    RARNotSupported,
    #[error(transparent)]
    Io(#[from] io::Error),
    #[error("Command completed successfully but destination `{0}` doesn't exist")]
    DestinationNotFound(String),
}

fn get_7z_path() -> SevenzipResult<PathBuf> {
    if cfg!(target_os = "windows") {
        // First, look into the resources folder:
        let resources_path = get_resources_path()
            .tap_none(|| log::error!("Couldn't find the resources path in get_7z_path"))
            .ok_or(SevenzipError::SevenzipNotFound)?;
        let local_path = vec![
            resources_path.join("7z").join("7z.exe"),
            resources_path.join("7z").join("7za.exe"),
        ]
        .into_iter()
        .map(|p| p.canonicalize().unwrap_or(p))
        .find(|p| p.is_file());

        if let Some(path) = local_path {
            log::trace!("Found included 7z: {path:?}");
            return Ok(path);
        }
    }

    match which("7z")
        .or_else(|_| which("7za"))
        .or_else(|_| which("7zz"))
        .or_else(|_| which("7zr"))
    {
        Ok(path) => {
            log::trace!("Found 7z in PATH: {path:?}");
            return Ok(path);
        }
        Err(e) if !matches!(e, which::Error::CannotFindBinaryPath) => {
            log::error!("Error while searching for 7z: {e:?}");
        }
        _ => {}
    }

    if cfg!(target_os = "windows") {
        // Assuming the default installation path:
        let system_drive = std::env::var("SystemDrive").unwrap_or("C:".to_string());
        let program_files =
            std::env::var("ProgramFiles").unwrap_or(system_drive.clone() + r"\Program Files");
        let program_files_x86 =
            std::env::var("ProgramFiles(x86)").unwrap_or(system_drive + r"\Program Files (x86)");
        let global_path = vec![
            PathBuf::from(program_files).join("7-Zip").join("7z.exe"),
            PathBuf::from(program_files_x86)
                .join("7-Zip")
                .join("7z.exe"),
        ]
        .into_iter()
        .map(|p| p.canonicalize().unwrap_or(p))
        .find(|p| p.is_file());

        if let Some(path) = global_path {
            log::trace!("Found 7z in Program Files: {path:?}");
            return Ok(path);
        }
    }

    Err(SevenzipError::SevenzipNotFound)
}

fn get_unrar_path() -> Option<PathBuf> {
    which("unrar")
        .tap_ok(|path| log::trace!("Found unrar in PATH: {path:?}"))
        .tap_err(|e| {
            if !matches!(e, which::Error::CannotFindBinaryPath) {
                log::error!("Error while searching for unrar: {e:?}");
            }
        })
        .ok()
}

fn get_winrar_path() -> Option<PathBuf> {
    match which("rar") {
        Ok(path) => {
            log::trace!("Found rar in PATH: {path:?}");
            return Some(path);
        }
        Err(e) if !matches!(e, which::Error::CannotFindBinaryPath) => {
            log::error!("Error while searching for rar: {e:?}");
        }
        _ => {}
    }

    if cfg!(target_os = "windows") {
        // Assuming the default installation path:
        let system_drive = std::env::var("SystemDrive").unwrap_or("C:".to_string());
        let program_files =
            std::env::var("ProgramFiles").unwrap_or(system_drive.clone() + r"\Program Files");
        let program_files_x86 =
            std::env::var("ProgramFiles(x86)").unwrap_or(system_drive + r"\Program Files (x86)");
        let global_path = vec![
            PathBuf::from(program_files).join("WinRAR").join("Rar.exe"),
            PathBuf::from(program_files_x86)
                .join("WinRAR")
                .join("Rar.exe"),
        ]
        .into_iter()
        .map(|p| p.canonicalize().unwrap_or(p))
        .find(|p| p.is_file());

        if let Some(path) = global_path {
            log::trace!("Found WinRAR in Program Files: {path:?}");
            return Some(path);
        }
    }

    None
}

/// Runs `7z i` to "Show information about supported formats".
/// Checks for the presence of Rar1/2/3/5 in the "Codecs" section of the output.
fn is_rar_supported<P: AsRef<Path>>(sevenzip_path: P) -> bool {
    #[allow(unused_mut)]
    let mut cmd = duct::cmd(sevenzip_path.as_ref(), vec![OsStr::new("i")]);
    log::trace!("7z cmd: {:?}", cmd);
    #[cfg(windows)]
    {
        cmd = cmd.before_spawn(crate::utils::windows::process::create_no_window);
    }
    match cmd.read() {
        Ok(output) => {
            log::trace!("7z output: {}", output);
            if let Some(codecs_section) = output.split("Codecs:").nth(1) {
                let re = Regex::new(r"(?m)Rar\d\r?$").unwrap();
                re.is_match(codecs_section)
            } else {
                false
            }
        }
        Err(error) => {
            log::error!("7z error: {}", error);
            false
        }
    }
}

/// Extracts an archive (.7z, .zip, .rar, .tar, ...) into the given destination folder.
pub fn extract_archive<P: AsRef<Path>>(source: P, destination: P) -> SevenzipResult<()> {
    let (source, destination) = (source.as_ref(), destination.as_ref());
    let extension = source
        .extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| ext.to_lowercase())
        .tap_none(|| log::warn!("Couldn't determine file extension for {source:?}"))
        .unwrap_or_default();

    let sevenzip_path = get_7z_path()?;

    // If the 7z version doesn't support `rar`, then fallback to `unrar`/`rar`:
    if extension == "rar" && !is_rar_supported(&sevenzip_path) {
        log::info!("7-Zip version does not support RAR extraction, falling back to UnRAR/WinRAR.");
        if let Some(unrar_path) = get_unrar_path() {
            #[allow(unused_mut)]
            let mut cmd = duct::cmd!(unrar_path, "x", source, "-y", destination);
            log::trace!("unrar cmd: {:?}", cmd);
            #[cfg(windows)]
            {
                cmd = cmd.before_spawn(crate::utils::windows::process::create_no_window);
            }
            let output = cmd.read()?;
            log::trace!("unrar output: {}", output);
            if !destination.exists() || fs_util::is_empty(destination)? {
                return Err(SevenzipError::DestinationNotFound(
                    destination.to_string_lossy().to_string(),
                ));
            }
            log::trace!("unrar success");
        } else if let Some(winrar_path) = get_winrar_path() {
            #[allow(unused_mut)]
            let mut cmd = duct::cmd!(winrar_path, "x", source, "-y", destination);
            log::trace!("rar cmd: {:?}", cmd);
            #[cfg(windows)]
            {
                cmd = cmd.before_spawn(crate::utils::windows::process::create_no_window);
            }
            let output = cmd.read()?;
            log::trace!("rar output: {}", output);
            if !destination.exists() || fs_util::is_empty(destination)? {
                return Err(SevenzipError::DestinationNotFound(
                    destination.to_string_lossy().to_string(),
                ));
            }
            log::trace!("rar success");
        } else {
            log::error!("Neither UnRAR nor WinRAR are installed.");
            return Err(SevenzipError::RARNotSupported);
        }
    } else {
        #[allow(unused_mut)]
        let mut cmd = duct::cmd(
            sevenzip_path,
            vec![
                OsStr::new("x"),
                source.as_ref(),
                OsStr::new("-y"),
                &osstring_concat!(OsStr::new("-o"), destination.as_ref()),
            ],
        );
        log::trace!("7z cmd: {:?}", cmd);
        #[cfg(windows)]
        {
            cmd = cmd.before_spawn(crate::utils::windows::process::create_no_window);
        }
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
