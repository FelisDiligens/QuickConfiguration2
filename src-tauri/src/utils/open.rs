/// The expectations are global, therefore tests using `fs_util` need to be synchronized.
#[cfg(test)]
pub static MOCK_MUTEX: std::sync::Mutex<()> = std::sync::Mutex::new(());

#[cfg_attr(test, mockall::automock, allow(unused))]
mod inner {
    use std::io;

    use cfg_if::cfg_if;

    #[cfg(not(target_os = "windows"))]
    use duct::cmd;

    #[cfg(target_os = "windows")]
    use windows::{
        Win32::Foundation::HWND,
        Win32::UI::Shell::ShellExecuteW,
        Win32::UI::WindowsAndMessaging::SW_SHOW,
        core::{PCWSTR, w},
    };

    #[cfg(target_os = "windows")]
    pub fn open_path_with_shell_execute(path: &str) -> windows_result::Result<()> {
        unsafe {
            let path = path
                .encode_utf16()
                .chain(std::iter::once(0u16))
                .collect::<Vec<u16>>();

            let result = ShellExecuteW(
                HWND(0),
                w!("open"),
                PCWSTR(path.as_ptr()),
                w!(""),
                w!(""),
                SW_SHOW,
            );

            // "If the function succeeds, it returns a value greater than 32."
            if result.0 <= 32 {
                return Err(windows_result::Error::from_hresult(
                    windows_result::HRESULT(result.0 as i32),
                ));
            }
        }
        Ok(())
    }

    /// Opens the given path with the file manager.
    pub fn open_path(path: &str) -> io::Result<()> {
        cfg_if! {
            if #[cfg(target_os = "linux")] {
                if crate::info::is_appimage() {
                    // Sanitize environment before spawning xdg-open in AppImage environments.
                    // Credit: https://github.com/skevetter/devpod/pull/710
                    if std::path::PathBuf::from("/usr/bin/xdg-open").is_file() {
                        cmd!("/usr/bin/xdg-open", path)
                    } else {
                        cmd!("xdg-open", path)
                    }
                    .env_remove("APPDIR")
                    .env_remove("APPIMAGE")
                    .env_remove("ARGV0")
                    .env_remove("OWD")
                    .env_remove("APPIMAGE_BUNDLE_XDG_OPEN")
                    .env_remove("LD_LIBRARY_PATH")
                    .env_remove("LD_PRELOAD")
                    .run()?;
                } else {
                    cmd!("xdg-open", path).run()?;
                }
            } else if #[cfg(target_os = "windows")] {
                // cmd!("explorer", path).run()?; // Exits with status code 1 for some reason even if the folder exists...
                // cmd!("cmd.exe", "/c", "start", "", path).run()?; // Works, but hacky
                open_path_with_shell_execute(path)?;
            } else if #[cfg(target_os = "macos")] {
                cmd!("open", path).run()?;
            } else {
                unimplemented!("OS not supported!");
            }
        }
        Ok(())
    }
}

#[cfg(not(test))]
pub use inner::*;
#[cfg(test)]
pub use mock_inner::*;
