#[cfg(test)]
pub mod tests;

use std::{
    ffi::{OsStr, OsString},
    iter,
    path::{self, Path, PathBuf},
};

use duct;
use itertools::Itertools;
use which::which;

fn get_wine_path() -> Option<PathBuf> {
    match which("wine") {
        Ok(path) => {
            log::trace!("Found wine in PATH: {path:?}");
            return Some(path);
        }
        Err(e) if !matches!(e, which::Error::CannotFindBinaryPath) => {
            log::error!("Error while searching for wine: {e:?}");
        }
        _ => {}
    }

    #[cfg(target_os = "macos")]
    {
        let path =
            PathBuf::from("/Applications/CrossOver.app/Contents/SharedSupport/CrossOver/bin/wine");
        if path.exists() {
            log::trace!("Found wine in CrossOver: {path:?}");
            return Some(path);
        }
    }

    None
}

/// Constructs a `duct::Expression` that calls the given program with wine.
pub fn wine_cmd<T, U>(
    program: T,
    args: U,
    wine_path: Option<PathBuf>,
    wine_prefix: Option<T>,
) -> Option<duct::Expression>
where
    T: Into<OsString>,
    U: IntoIterator,
    U::Item: Into<OsString>,
{
    let wine_path = wine_path.or_else(get_wine_path)?;
    let cmd = duct::cmd(
        wine_path,
        iter::once(program.into()).chain(args.into_iter().map(|arg| arg.into())),
    );
    if let Some(wine_prefix) = wine_prefix {
        Some(cmd.env("WINEPREFIX", wine_prefix))
    } else {
        Some(cmd)
    }
}

/// Can be used to construct an absolute path with a prepended drive letter (usually Z:\).
/// e.g. `/home/user/Download/example.txt` becomes `Z:\home\user\Download\example.txt`
pub fn convert_path_to_dos<P: AsRef<Path>>(
    path: P,
    drive_letter: char,
) -> anyhow::Result<OsString> {
    let mut wine_path = OsString::from(format!(r"{drive_letter}:\"));
    Itertools::intersperse(
        path::absolute(path.as_ref())?
            .strip_prefix("/")?
            .components()
            .map(|component| component.as_os_str()),
        OsStr::new(r"\"),
    )
    .for_each(|component| {
        wine_path.push(component);
    });
    if path.as_ref().to_string_lossy().ends_with(r"/") {
        // Add trailing slash:
        wine_path.push(r"\");
    }
    Ok(wine_path)
}
