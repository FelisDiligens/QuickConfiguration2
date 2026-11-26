#[cfg(test)]
mod tests;

use std::io;
use std::path::{Path, PathBuf, StripPrefixError};

use normalize_path::NormalizePath;

pub fn get_relative_path<P1: AsRef<Path>, P2: AsRef<Path>>(
    base_path: P1,
    path: P2,
) -> Result<PathBuf, StripPrefixError> {
    let relative_path = path.as_ref().strip_prefix(base_path.as_ref())?;
    if relative_path.is_empty() {
        return Ok(PathBuf::from("."));
    }
    Ok(relative_path.to_path_buf())
}

/// Joins a relative path onto a root path and returns the resulting normalized absolute path.
/// Foreign path separators (`/` and `\`) in the relative path are converted
/// to the current platform's separator first.
pub fn join_normalized<P1: AsRef<Path>, P2: AsRef<Path>>(
    root_path: P1,
    relative_path: P2,
) -> io::Result<PathBuf> {
    let relative_path = relative_path
        .as_ref()
        .to_string_lossy()
        .replace(r"\", std::path::MAIN_SEPARATOR_STR)
        .replace(r"/", std::path::MAIN_SEPARATOR_STR);
    Ok(std::path::absolute(root_path.as_ref().join(relative_path))?.normalize())
}

/// Checks if a filename is valid for use as a folder or file name.
/// Returns `true` if the filename is valid, `false` otherwise.
pub fn is_filename_valid(filename: &str) -> bool {
    // Empty filenames are invalid:
    if filename.is_empty() {
        return false;
    }

    // Check for control characters (ASCII 0-31):
    for ch in filename.chars() {
        if (ch as u32) < 32 {
            return false;
        }
    }

    #[cfg(target_os = "windows")]
    {
        is_filename_valid_windows(filename)
    }
    #[cfg(any(target_os = "linux", target_os = "macos"))]
    {
        is_filename_valid_unix(filename)
    }
    #[cfg(not(any(target_os = "windows", target_os = "linux", target_os = "macos")))]
    {
        unimplemented!("This operating system is not supported")
    }
}

#[cfg(target_os = "windows")]
fn is_filename_valid_windows(filename: &str) -> bool {
    let invalid_chars = ['<', '>', ':', '"', '|', '?', '*'];

    for ch in filename.chars() {
        if invalid_chars.contains(&ch) {
            return false;
        }
    }

    let reserved_names = [
        "CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8",
        "COM9", "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
    ];

    let upper_filename = filename.to_uppercase();
    if reserved_names.contains(&upper_filename.as_str()) {
        return false;
    }

    if filename.ends_with(' ') || filename.ends_with('.') {
        return false;
    }

    true
}

#[cfg(any(target_os = "linux", target_os = "macos"))]
fn is_filename_valid_unix(filename: &str) -> bool {
    if filename.contains('/') {
        return false;
    }

    if filename == "." || filename == ".." {
        return false;
    }

    true
}

/// Checks if a path is valid by validating all of its components as filenames.
/// Prefixes (e.g. `C:`), root directories, `.` and `..` components are allowed.
/// Returns `true` if the path is valid, `false` otherwise.
pub fn is_path_valid(path: &str) -> bool {
    use std::path::Component;

    if path.is_empty() {
        return false;
    }

    for component in Path::new(path).components() {
        let name = match component {
            Component::Prefix(_)
            | Component::RootDir
            | Component::CurDir
            | Component::ParentDir => continue,
            Component::Normal(name) => name,
        };
        let Some(name) = name.to_str() else {
            return false;
        };
        if !is_filename_valid(name) {
            return false;
        }
    }

    true
}

/// Replaces invalid filename characters with a replacement character.
/// Only replaces invalid characters; does not handle reserved names or structural issues.
pub fn sanitize_filename(filename: &str, replacement: char) -> String {
    if filename.is_empty() {
        return String::new();
    }

    let mut result = String::with_capacity(filename.len());

    for ch in filename.chars() {
        // Replace control characters (ASCII 0-31)
        if (ch as u32) < 32 {
            result.push(replacement);
            continue;
        }

        #[cfg(target_os = "windows")]
        {
            if ['<', '>', ':', '"', '|', '?', '*'].contains(&ch) {
                result.push(replacement);
                continue;
            }
        }
        #[cfg(any(target_os = "linux", target_os = "macos"))]
        {
            if ch == '/' {
                result.push(replacement);
                continue;
            }
        }
        #[cfg(not(any(target_os = "windows", target_os = "linux", target_os = "macos")))]
        {
            unimplemented!("This operating system is not supported")
        }

        result.push(ch);
    }

    result.trim_end().to_string()
}
