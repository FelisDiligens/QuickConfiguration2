//! Dynamic registration and unregistration of custom URL schemes, e.g. `nxm://`.
//!
//! Based on the Tauri deep-link plugin, see:
//! - https://v2.tauri.app/plugin/deep-linking
//! - https://github.com/tauri-apps/plugins-workspace/tree/v2/plugins/deep-link
//!
//! Unfortunately, the plugin doesn't emit events when dynamically registring and unregistring URL protocols:
//!
//! > "To enhance its checks, we only match deep links against the schemes defined in the Tauri configuration
//! > i.e. dynamic schemes WON'T be processed."
//! > See: https://github.com/tauri-apps/plugins-workspace/blob/e919bab3eb4653eedb4b08fcb7e5cdd44b313f1e/plugins/deep-link/src/lib.rs#L196
//!
//! It also doesn't properly cleanup after itself on Linux which causes `isRegistered` to still return `true` even after `unregister` was called.

#[cfg(target_os = "linux")]
use std::fs;
use std::sync::Mutex;

#[cfg(target_os = "linux")]
use duct::cmd;
#[cfg(target_os = "linux")]
use indoc::indoc;
#[cfg(target_os = "linux")]
use ini::Ini;
#[cfg(target_os = "linux")]
use itertools::Itertools;
#[cfg(target_os = "linux")]
use tap::TapFallible;
#[cfg(target_os = "windows")]
use windows_registry::{CLASSES_ROOT, CURRENT_USER, LOCAL_MACHINE};

use crate::features::linkhandler::error::NXMError;
#[cfg(target_os = "linux")]
use crate::utils::fs_util;
#[cfg(target_os = "linux")]
use crate::utils::ini::IniAccessors;
#[cfg(target_os = "linux")]
use crate::utils::paths::get_executable_path;

pub mod error;

#[derive(Default)]
pub struct NXMLink {
    pub current: Mutex<Option<url::Url>>,
}

impl NXMLink {
    pub fn new(url: Option<url::Url>) -> Self {
        Self {
            current: Mutex::new(url),
        }
    }

    pub fn get_current(&self) -> Result<Option<url::Url>, NXMError> {
        return Ok(self.current.lock().unwrap().clone());
    }

    pub fn set_current(&self, url: url::Url) -> Result<(), NXMError> {
        let mut current = self.current.lock().unwrap();
        current.replace(url);
        Ok(())
    }
}

pub fn register<S: AsRef<str>>(protocol: S) -> Result<(), NXMError> {
    #[cfg(target_os = "windows")]
    {
        let protocol = protocol.as_ref();
        let key_base = format!(r"Software\Classes\{protocol}");

        let exe = dunce::simplified(&tauri::utils::platform::current_exe()?)
            .display()
            .to_string();

        let key_reg = CURRENT_USER.create(&key_base)?;
        key_reg.set_string("", format!("URL:{protocol} protocol"))?;
        key_reg.set_string("URL Protocol", "")?;

        let icon_reg = CURRENT_USER.create(format!(r"{key_base}\DefaultIcon"))?;
        icon_reg.set_string("", format!("{exe},0"))?;

        let cmd_reg = CURRENT_USER.create(format!(r"{key_base}\shell\open\command"))?;

        cmd_reg.set_string("", format!("\"{exe}\" \"%1\""))?;

        Ok(())
    }

    #[cfg(target_os = "linux")]
    {
        let bin = tauri::utils::platform::current_exe()?;
        let file_name = format!(
            "{}-handler.desktop",
            bin.file_name().unwrap().to_string_lossy()
        );
        let exec = get_executable_path()?.to_string_lossy().to_string();
        let qualified_exec = format!("\"{}\" %u", exec);

        let target = dirs::data_dir().unwrap().join("applications");

        fs::create_dir_all(&target)?;

        let target_file = target.join(&file_name);

        let mime_type = format!("x-scheme-handler/{}", protocol.as_ref());

        if let Ok(mut desktop_file) = Ini::load_from_file(&target_file) {
            let mut change = false;
            let section = Some("Desktop Entry");

            let old_mimes = desktop_file.string(section, "MimeType").unwrap_or_default();

            // if the mime type is not present, append it to the list
            if !old_mimes.split(';').any(|mime| mime == mime_type) {
                desktop_file.set_string(section, "MimeType", &format!("{mime_type};{old_mimes}"));
                change = true;
            }

            // if the exec command doesnt match, update to the new one
            let old_exec = desktop_file.string(section, "Exec").unwrap_or_default();
            if old_exec != qualified_exec {
                desktop_file.set_string(section, "Exec", &qualified_exec);
                change = true;
            }

            // if any property has changed, rewrite the .desktop file
            if change {
                desktop_file.write_to_file(&target_file)?;
                log::trace!("Rewrote {target_file:?}");
            }
        } else {
            fs_util::write_to_file(
                &target_file,
                format!(
                    indoc! {"
                        [Desktop Entry]
                        Type=Application
                        Name={name}
                        Exec={qualified_exec}
                        Terminal=false
                        MimeType={mime_type}
                        NoDisplay=true
                    "},
                    name = crate::info::APP_NAME,
                    qualified_exec = qualified_exec,
                    mime_type = mime_type
                ),
            )?;
            log::trace!("Created {target_file:?}");
        }

        cmd!("update-desktop-database", target)
            .run()
            .tap_err(|e| log::error!("Failed to run OS command `update-desktop-database`: {e}"))?;

        cmd!("xdg-mime", "default", file_name, mime_type)
            .run()
            .tap_err(|e| log::error!("Failed to run OS command `xdg-mime`: {e}"))?;

        Ok(())
    }

    #[cfg(not(any(target_os = "windows", target_os = "linux")))]
    {
        let _ = protocol.as_ref();
        Err(NXMError::UnsupportedPlatform)
    }
}

pub fn unregister<S: AsRef<str>>(protocol: S) -> Result<(), NXMError> {
    #[cfg(target_os = "windows")]
    {
        let protocol = protocol.as_ref();
        let path = format!(r"Software\Classes\{protocol}");
        if LOCAL_MACHINE.open(&path).is_ok() {
            LOCAL_MACHINE.remove_tree(&path)?;
        }
        if CURRENT_USER.open(&path).is_ok() {
            CURRENT_USER.remove_tree(&path)?;
        }
        Ok(())
    }

    #[cfg(target_os = "linux")]
    {
        // Build path to .desktop and mime files, like the plugin does:
        let applications_folder = dirs::data_dir().unwrap().join("applications");
        let desktop_file_name = format!(
            "{}-handler.desktop",
            tauri::utils::platform::current_exe()?
                .file_name()
                .unwrap()
                .to_string_lossy()
        );
        let scheme = format!("x-scheme-handler/{}", protocol.as_ref());

        // Remove from ~/.config/mimeapps.list:
        let mimeapps_path = dirs::config_dir().unwrap().join("mimeapps.list");
        let mut mimeapps = Ini::load_from_file(&mimeapps_path)?;
        if let Some(value) = mimeapps.string(Some("Default Applications"), &scheme)
            && value == desktop_file_name
            && mimeapps
                .delete_from(Some("Default Applications"), &scheme)
                .is_some()
        {
            mimeapps.write_to_file(&mimeapps_path)?;
            log::trace!("Rewrote {mimeapps_path:?}");
        }

        // Remove the .desktop file or at least remove from the MimeType list:
        let desktop_file_path = applications_folder.join(&desktop_file_name);
        if let Ok(mut desktop_ini) = Ini::load_from_file(&desktop_file_path)
            && let Some(mime_types) = desktop_ini.list(Some("Desktop Entry"), "MimeType", ";")
        {
            let has_other_mimetypes = mime_types.iter().any(|mime_type| *mime_type != scheme);
            if !has_other_mimetypes {
                // Delete desktop file if no other mimetypes are registered:
                fs::remove_file(&desktop_file_path)?;
                log::trace!("Removed {desktop_file_path:?}");
            } else {
                // Overwrite desktop file, removing our protocol mimetype:
                desktop_ini.set_list(
                    Some("Desktop Entry"),
                    "MimeType",
                    ";",
                    mime_types
                        .into_iter()
                        .filter(|mime_type| *mime_type != scheme)
                        .unique()
                        .collect(),
                );
                desktop_ini.write_to_file(&desktop_file_path)?;
                log::trace!("Rewrote {desktop_file_path:?}");
            }
        }

        // Remove from mimeinfo.cache file:
        // (I couldn't find a better way to update it, but it seems to be
        //   responsible for still showing the desktop file when calling
        //   `xdg-mime`, even after unregistering it the app)
        let mimecache_file = applications_folder.join("mimeinfo.cache");
        let mut new_lines = Vec::new();
        let mut found_mime = false;
        for line in fs::read_to_string(&mimecache_file)?.lines() {
            if line.starts_with(&format!("{scheme}=")) {
                // Remove our desktop file from the handler list:
                let desktop_files: Vec<String> = line
                    .strip_prefix(&format!("{scheme}="))
                    .unwrap_or_default()
                    .split(";")
                    .map(|file_name| file_name.trim().to_owned())
                    .filter(|file_name| *file_name != desktop_file_name)
                    .filter(|file_name| !file_name.is_empty())
                    .unique()
                    .collect();
                new_lines.push(format!("{scheme}={};", desktop_files.join(";")));
                found_mime = true;
                log::trace!(
                    "Found \"{scheme}\" in {mimecache_file:?}, filtered out \"{desktop_file_name}\""
                );
            } else {
                new_lines.push(line.to_string());
            }
        }
        if found_mime {
            fs_util::write_to_file(&mimecache_file, new_lines.join("\n"))?;
            log::trace!("Rewrote {mimecache_file:?}");
        }

        Ok(())
    }

    #[cfg(not(any(target_os = "windows", target_os = "linux")))]
    {
        let _ = protocol.as_ref();
        Err(NXMError::UnsupportedPlatform)
    }
}

pub fn is_registered<S: AsRef<str>>(protocol: S) -> Result<bool, NXMError> {
    #[cfg(target_os = "windows")]
    {
        let protocol = protocol.as_ref();
        let Ok(cmd_reg) = CLASSES_ROOT.open(format!(r"{protocol}\shell\open\command")) else {
            return Ok(false);
        };

        let registered_cmd = cmd_reg.get_string("")?;

        let exe = dunce::simplified(&tauri::utils::platform::current_exe()?)
            .display()
            .to_string();

        Ok(registered_cmd == format!("\"{exe}\" \"%1\""))
    }

    #[cfg(target_os = "linux")]
    {
        let file_name = format!(
            "{}-handler.desktop",
            tauri::utils::platform::current_exe()?
                .file_name()
                .unwrap()
                .to_string_lossy()
        );

        let output = duct::cmd!(
            "xdg-mime",
            "query",
            "default",
            &format!("x-scheme-handler/{}", protocol.as_ref())
        )
        .read()
        .tap_err(|e| log::error!("Failed to run OS command `xdg-mime`: {e}"))?;

        Ok(output.contains(&file_name))
    }

    #[cfg(not(any(target_os = "windows", target_os = "linux")))]
    {
        let _ = protocol.as_ref();
        Err(NXMError::UnsupportedPlatform)
    }
}
