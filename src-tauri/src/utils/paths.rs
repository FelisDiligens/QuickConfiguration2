//! Contains all functions that resolve or determine paths and can contain platform-specific code.

use anyhow::Result;
use std::path::PathBuf;
use std::{env, io};

#[cfg(target_os = "linux")]
use std::path::Path;

/// C:\Users\%USER%\AppData\Local\Fallout 76 Quick Configuration
pub fn get_legacy_config_path() -> Option<PathBuf> {
    dirs::config_local_dir().map(|config| config.join("Fallout 76 Quick Configuration"))
}

/// C:\Users\%USER%\AppData\Local\Fallout 76 Quick Configuration\config.ini
pub fn get_legacy_config_file_path() -> Option<PathBuf> {
    get_legacy_config_path().map(|config| config.join("config.ini"))
}

/// C:\Users\%USER%\AppData\Local\Fallout 76 Quick Configuration\profiles.xml
pub fn get_legacy_profiles_file_path() -> Option<PathBuf> {
    get_legacy_config_path().map(|config| config.join("profiles.xml"))
}

/// Returns the path of the configuration directory.
pub fn get_config_path() -> Option<PathBuf> {
    get_legacy_config_path()
}

/// Returns the path of the directory containing log files.
/// It's the same as the config path.
pub fn get_logs_path() -> Option<PathBuf> {
    get_config_path()
}

/// Returns the path to the current log file.
/// This is usually `C:\Users\%USER%\AppData\Local\Fallout 76 Quick Configuration\Fallout 76 Quick Configuration.log`
pub fn get_current_log_file_path() -> Option<PathBuf> {
    get_logs_path().map(|path| {
        path.join(crate::info::TAURI_APP_PRODUCT_NAME)
            .with_extension("log")
    })
}

/// Returns the path of the new configuration json file.
pub fn get_config_file_path() -> Option<PathBuf> {
    get_config_path().map(|config| config.join("config.json"))
}

/// Returns the path of the new profile json file.
pub fn get_profiles_file_path() -> Option<PathBuf> {
    get_config_path().map(|config| config.join("profiles.json"))
}

/// Returns the path of the folder containing all translations.
pub fn get_translation_folder_path() -> Option<PathBuf> {
    get_config_path().map(|config| config.join("languages"))
}

/// Returns the path of the working directory at the time the AppImage is called.
#[cfg(target_os = "linux")]
pub fn get_appimage_working_directory() -> Option<PathBuf> {
    // Detect working dir at the time the AppImage was launched on Linux by environment variable:
    // (See: https://docs.appimage.org/packaging-guide/environment-variables.html)
    let owd = env::var("OWD").ok()?;
    let path = Path::new(&owd);
    if path.exists() {
        Some(path.to_path_buf())
    } else {
        None
    }
}

/// Returns the path of the mountpoint of the ISO9660 image contained in the AppImage
#[cfg(target_os = "linux")]
pub fn get_appimage_mountpoint() -> Option<PathBuf> {
    // (See: https://docs.appimage.org/packaging-guide/environment-variables.html)
    let appdir = env::var("APPDIR").ok()?;
    let path = Path::new(&appdir);
    if path.exists() {
        Some(path.to_path_buf())
    } else {
        None
    }
}

/// Returns the path of the app executable.
pub fn get_executable_path() -> io::Result<PathBuf> {
    // Detect AppImage path on Linux by environment variable:
    // (See: https://docs.appimage.org/packaging-guide/environment-variables.html)
    #[cfg(target_os = "linux")]
    if let Ok(path) = env::var("APPIMAGE") {
        let path = Path::new(&path);
        if path.exists() {
            return Ok(path.to_path_buf());
        }
    }

    env::current_exe()
}

/// Returns the path of where the app was installed to.
pub fn get_install_path() -> Result<PathBuf> {
    let mut path = get_executable_path()?;
    path.pop();
    Ok(path)
}

/// Returns the path to the resources folder.
/// See: https://docs.rs/tauri/latest/src/tauri/path/desktop.rs.html#230
/// And: https://github.com/tauri-apps/tauri/blob/41fdca7d1991cf4b4b69a5a758a5371333218487/crates/tauri-utils/src/platform.rs#L281
pub fn get_resources_path() -> Option<PathBuf> {
    let mut paths = Vec::with_capacity(3);
    paths.push(get_install_path().ok()); // Folder where the binary lives
    paths.push(env::current_dir().ok()); // Current working directory
    #[cfg(target_os = "linux")]
    {
        // /usr/lib/Fallout 76 Quick Configuration/
        paths.push(Some(
            PathBuf::from("/usr/lib/").join(crate::info::TAURI_APP_PRODUCT_NAME),
        ));
        // /usr/lib/f76qc2/
        paths.push(Some(
            PathBuf::from("/usr/lib/").join(crate::info::APP_BINARY_NAME),
        ));
        // ${APPDIR}/usr/lib/Fallout 76 Quick Configuration/
        paths.push(crate::utils::paths::get_appimage_mountpoint().map(|path| {
            path.join("usr")
                .join("lib")
                .join(crate::info::TAURI_APP_PRODUCT_NAME)
        }));
        // ${APPDIR}/usr/lib/f76qc2/
        paths.push(crate::utils::paths::get_appimage_mountpoint().map(|path| {
            path.join("usr")
                .join("lib")
                .join(crate::info::APP_BINARY_NAME)
        }));
    }
    #[cfg(target_os = "macos")]
    {
        // ~/Applications/Fallout 76 Quick Configuration.app/Resources
        paths.push(get_install_path().ok().map(|path| path.join("Resources")));
    }
    paths
        .into_iter()
        .flatten()
        .map(|p| p.join("resources"))
        .map(|p| p.canonicalize().unwrap_or(p))
        .find(|p| p.is_dir())
}
