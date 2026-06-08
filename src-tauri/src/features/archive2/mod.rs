#[cfg(test)]
pub mod tests;

pub mod models;
mod read;

pub use read::*;

use std::ffi::{OsStr, OsString};
use std::io;
use std::path::{Path, PathBuf};

use cfg_if::cfg_if;
use thiserror::Error;

use crate::features::archive2::models::{Archive2Compression, Archive2Format};
use crate::utils::{fs_util, paths::get_resources_path};

#[cfg(target_os = "windows")]
use duct;

#[cfg(not(target_os = "windows"))]
use crate::features::wine::{convert_path_to_dos, wine_cmd};

pub type Archive2Result<T> = Result<T, Archive2Error>;

#[derive(Error, Debug, strum::AsRefStr)]
pub enum Archive2Error {
    #[error("Couldn't find wine")]
    WineNotFound,
    #[error("Wine Mono is not installed")]
    WineMonoNotInstalled,
    #[error("Couldn't find Archive2")]
    Archive2NotFound,
    // Download link: https://www.microsoft.com/en-us/download/details.aspx?id=30679
    #[error(
        "Could not load file or assembly 'Archive2Interop.dll'. Visual C++ Redistributable for Visual Studio 2012 Update 4 is likely not installed."
    )]
    Archive2RequirementsNotMet,
    #[error("Extraction failed, folder '{0}' has not been created or is empty.")]
    ExtractionFailed(String),
    #[error("Packing failed, archive '{0}' has not been created.")]
    PackingFailed(String),
    #[error(transparent)]
    Io(#[from] io::Error),
    #[error(transparent)]
    Anyhow(#[from] anyhow::Error),
}

/// Searches the app's installation path and the current working directory for resources/Archive2/Archive2.exe.
/// Returns the first match it finds (if any).
fn get_archive2_path() -> Option<PathBuf> {
    let path = get_resources_path()?.join("Archive2").join("Archive2.exe");
    if path.is_file() {
        Some(path.canonicalize().unwrap_or(path))
    } else {
        None
    }
}

fn archive2_cmd<T>(args: T) -> Archive2Result<duct::Expression>
where
    T: IntoIterator,
    T::Item: Into<OsString>,
{
    cfg_if! {
        if #[cfg(target_os = "windows")] {
            match get_archive2_path() {
                Some(path) => Ok(duct::cmd(path, args)),
                None => Err(Archive2Error::Archive2NotFound)
            }
        } else {
            let Some(path) = get_archive2_path() else {
                return Err(Archive2Error::Archive2NotFound);
            };
            match wine_cmd(path, args, None, None) {
                Some(cmd) => Ok(cmd),
                None => Err(Archive2Error::WineNotFound)
            }
        }
    }
}

fn archive2_call<T>(args: T) -> Archive2Result<()>
where
    T: IntoIterator,
    T::Item: Into<OsString>,
{
    let cmd = archive2_cmd(args)?.stderr_to_stdout();
    log::trace!("Archive2 cmd: {:?}", cmd);
    let output = cmd.read()?;
    log::trace!("Archive2 output: {}", output);

    // "System.IO.FileNotFoundException: Could not load file or assembly 'Archive2Interop.dll'"
    if output.contains("System.IO.FileNotFoundException") && output.contains("Archive2Interop.dll")
    {
        log::error!("Archive2 requirements not met, found 'Archive2Interop.dll' error");
        return Err(Archive2Error::Archive2RequirementsNotMet);
    }
    // "0150:err:mscoree:CLRRuntimeInfo_GetRuntimeHost Wine Mono is not installed"
    if output.contains("err:mscoree:CLRRuntimeInfo_GetRuntimeHost") && output.contains("Wine Mono")
    {
        log::error!("Archive2 requirements not met, found 'Wine Mono is not installed' error");
        return Err(Archive2Error::WineMonoNotInstalled);
    }

    log::trace!("Archive2 success");
    Ok(())
}

/// Extracts the contents of a *.ba2 archive into a folder.
pub fn extract_archive2<S: AsRef<Path>>(ba2_archive: S, output_folder: S) -> Archive2Result<()> {
    {
        #[cfg(target_os = "windows")]
        let (ba2_archive, output_folder): (OsString, OsString) =
            (ba2_archive.as_ref().into(), output_folder.as_ref().into());
        #[cfg(not(target_os = "windows"))]
        let (ba2_archive, output_folder): (OsString, OsString) = (
            convert_path_to_dos(&ba2_archive, 'Z')?,
            convert_path_to_dos(&output_folder, 'Z')?,
        );
        log::trace!("Archive2: Extracting archive {ba2_archive:?} into folder {output_folder:?}.");
        archive2_call(vec![
            &ba2_archive,
            &[OsStr::new("-extract="), output_folder.as_ref()]
                .into_iter()
                .collect::<OsString>(),
            OsStr::new("-quiet"),
        ])?;
    }
    if !output_folder.as_ref().exists() || fs_util::is_empty(&output_folder)? {
        return Err(Archive2Error::ExtractionFailed(
            output_folder.as_ref().to_string_lossy().to_string(),
        ));
    }
    Ok(())
}

/// Opens Archive2.exe to explore a given *.ba2 archive's content.
pub fn explore_archive2<S: AsRef<Path>>(ba2_archive: S) -> Archive2Result<duct::Handle> {
    #[cfg(target_os = "windows")]
    let ba2_archive: OsString = ba2_archive.as_ref().into();
    #[cfg(not(target_os = "windows"))]
    let ba2_archive: OsString = convert_path_to_dos(&ba2_archive, 'Z')?;
    Ok(archive2_cmd(vec![ba2_archive])?.start()?)
}

/// Opens Archive2.exe with no arguments.
pub fn open_archive2() -> Archive2Result<duct::Handle> {
    Ok(archive2_cmd(Vec::<OsString>::new())?.start()?)
}

/// Creates a *.ba2 archive from the contents of the folder with the given compression and format.
pub fn create_archive2<S: AsRef<Path>>(
    ba2_archive: S,
    source_folder: S,
    format: Archive2Format,
    compression: Archive2Compression,
) -> Archive2Result<()> {
    {
        #[cfg(target_os = "windows")]
        let (ba2_archive, source_folder): (OsString, OsString) =
            (ba2_archive.as_ref().into(), source_folder.as_ref().into());
        #[cfg(not(target_os = "windows"))]
        let (ba2_archive, source_folder): (OsString, OsString) = (
            convert_path_to_dos(&ba2_archive, 'Z')?,
            convert_path_to_dos(&source_folder, 'Z')?,
        );
        log::trace!(
            "Archive2: Creating archive {ba2_archive:?} from folder {source_folder:?} with format {format:?} and compression {compression:?}."
        );
        archive2_call(vec![
            &source_folder,
            &[OsStr::new("-create="), ba2_archive.as_ref()]
                .into_iter()
                .collect::<OsString>(),
            &format!("-compression={}", compression).into(),
            &format!("-format={}", format).into(),
            &[OsStr::new("-root="), source_folder.as_ref()]
                .into_iter()
                .collect::<OsString>(),
            OsStr::new("-tempFiles"),
            OsStr::new("-quiet"),
        ])?;
    }
    if !ba2_archive.as_ref().exists() {
        return Err(Archive2Error::PackingFailed(
            ba2_archive.as_ref().to_string_lossy().to_string(),
        ));
    }
    Ok(())
}
