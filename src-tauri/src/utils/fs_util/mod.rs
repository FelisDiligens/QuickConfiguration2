#[cfg(test)]
pub mod tests;

use std::ffi::OsStr;
pub use std::fs;
use std::fs::File;
use std::io::{self, Read, Write};
use std::path::{Path, PathBuf, StripPrefixError};

use cfg_if::cfg_if;

use crate::utils::channel;

pub fn get_relative_path<P1: AsRef<Path>, P2: AsRef<Path>>(
    base_path: P1,
    path: P2,
) -> Result<PathBuf, StripPrefixError> {
    let relative_path = path.as_ref().strip_prefix(base_path.as_ref())?;
    if relative_path == "" {
        return Ok(PathBuf::from("."));
    }
    Ok(relative_path.to_path_buf())
}

#[derive(Debug, Default, Clone)]
pub enum CopyMethod {
    #[default]
    Copy,
    Hardlink,
    Symlink,
}

/// Checks if two paths are on the same drive on Windows.
/// Returns `Some(true)` if they are on the same drive or `Some(false)` if it isn't.
/// Otherwise returns `None` if the drive cannot be determined.
#[cfg(target_os = "windows")]
fn are_on_same_drive(src: &Path, dst: &Path) -> Option<bool> {
    use std::path::Component;

    // Canonicalize to get absolute paths with drive letters
    let src = src.canonicalize().ok()?;
    let dst = dst.canonicalize().ok()?;

    // Get the drive letter from both paths by checking the prefix component
    let get_drive = |path: &Path| -> Option<String> {
        path.components().find_map(|c| match c {
            Component::Prefix(prefix) => {
                // Convert the prefix to a string for comparison
                prefix.as_os_str().to_str().map(|s| s.to_uppercase())
            }
            _ => None,
        })
    };

    let src_drive = get_drive(&src)?;
    let dst_drive = get_drive(&dst)?;

    Some(src_drive == dst_drive)
}

/// Copies/symlinks/hardlinks `src` to `dst`.
/// If the destination already exists, it will be deleted and replaced.
pub fn copy_or_link<P1: AsRef<Path>, P2: AsRef<Path>>(
    src: P1,
    dst: P2,
    method: CopyMethod,
) -> io::Result<()> {
    let src_path = src.as_ref();
    let dst_path = dst.as_ref();
    match method {
        CopyMethod::Copy => {
            if dst_path.exists() {
                // Delete destination in case it's a hardlink:
                // > "Note that if from and to both point to the same file, then the file will likely get truncated by this operation."
                fs::remove_file(dst_path)?;
            }
            fs::copy(src_path, dst_path)?;
        }
        CopyMethod::Hardlink => {
            if dst_path.exists() {
                // Hardlink can only be created if destination doesn't already exist:
                fs::remove_file(dst_path)?;
            }

            // Hard links can only be created within the same filesystem:
            #[cfg(target_os = "windows")]
            {
                // On Windows, we assume that if both paths don't share the same drive letter,
                // that they must be on different filesystems. (This is not necessarily the case but still.)
                // If the drive letters cannot be determined, just assume that they are the same:
                if !are_on_same_drive(src_path, dst_path).unwrap_or(true) {
                    // Fallback to copy if on different drives:
                    fs::copy(src_path, dst_path)?;
                    return Ok(());
                }
            }

            fs::hard_link(src_path, dst_path)?;
        }
        CopyMethod::Symlink => {
            // TODO: On Windows, check if we have permission to create symlinks (`SeCreateSymbolicLinkPrivilege` or admin). If not, fallback to copying.
            if dst_path.exists() {
                // Symlink can only be created if destination doesn't already exist:
                fs::remove_file(dst_path)?;
            }
            cfg_if! {
                if #[cfg(target_os = "windows")] {
                    std::os::windows::fs::symlink_file(src_path, dst_path)?;
                } else {
                    std::os::unix::fs::symlink(src_path, dst_path)?;
                }
            }
        }
    }
    Ok(())
}

/// Tries to move the file using `fs::rename`. If that fails, falls back to `fs::copy` and `fs::remove_file`.
/// If the destination already exists, it will be deleted and replaced.
pub fn move_file<P1: AsRef<Path>, P2: AsRef<Path>>(src: P1, dst: P2) -> io::Result<()> {
    let src_path = src.as_ref();
    let dst_path = dst.as_ref();
    if dst_path.exists() {
        fs::remove_file(dst_path)?;
    }
    if let Err(e) = fs::rename(src_path, dst_path) {
        log::warn!("fs::rename failed, falling back to fs::copy: {}", e);
        fs::copy(src_path, dst_path)?;
        fs::remove_file(src_path)?;
    }
    Ok(())
}

/// Tries to move the folder using `fs::rename`. If that fails, falls back to `copy_dir_all` and `fs::remove_dir_all`.
/// If the destination already exists, it will be deleted and replaced.
pub fn move_folder<P1: AsRef<Path>, P2: AsRef<Path>>(src: P1, dst: P2) -> io::Result<()> {
    let src_path = src.as_ref();
    let dst_path = dst.as_ref();
    if dst_path.exists() {
        fs::remove_dir_all(dst_path)?;
    }
    if let Err(e) = fs::rename(src_path, dst_path) {
        log::warn!("fs::rename failed, falling back to copy_dir_all: {}", e);
        copy_dir_all(src_path, dst_path, CopyMethod::Copy)?;
        fs::remove_dir_all(src_path)?;
    }
    Ok(())
}

/// Copies (or symlink/hardlink) the contents of a folder recursively into another folder.
/// Creates the destination folder (and all it's parents) if needed.
/// This function is not atomic. If it returns an error, any files it was able to copy will remain.
pub fn copy_dir_all<P1: AsRef<Path>, P2: AsRef<Path>>(
    src: P1,
    dst: P2,
    method: CopyMethod,
) -> io::Result<()> {
    fs::create_dir_all(&dst)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;

        let src_path = entry.path();
        let dst_path = dst.as_ref().join(entry.file_name());

        if ty.is_dir() {
            copy_dir_all(src_path, dst_path, method.clone())?;
        } else {
            copy_or_link(src_path, dst_path, method.clone())?;
        }
    }
    Ok(())
}

#[derive(Debug, Clone)]
pub enum CopyDirProgress {
    /// Counting files, creating directories, etc.
    Preparing,
    /// A file is being copied
    Copying {
        /// Current file name that is being copied
        file_name: String,
        /// Number of copied files (0..total, excluding total)
        copied: usize,
        /// Number of files to copy in total
        total: usize,
    },
    /// All files were copied
    Finished {
        /// Number of files that were copied
        copied: usize,
    },
}

/// Copies (or symlink/hardlink) the contents of a folder recursively into another folder.
/// Creates the destination folder (and all it's parents) if needed.
/// This function is not atomic. If it returns an error, any files it was able to copy will remain.
/// It will send it's progress via the `tx` mspc channel.
#[function_name::named]
pub fn copy_dir_all_with_progress<P1: AsRef<Path>, P2: AsRef<Path>>(
    src: P1,
    dst: P2,
    method: CopyMethod,
    tx: tokio::sync::mpsc::Sender<CopyDirProgress>,
) -> io::Result<()> {
    let scope = function_name!();

    // Send preparing status
    let _ = channel::blocking_send(&tx, scope, CopyDirProgress::Preparing);

    // First, count all files to copy
    let total_files = count_files_recursively(&src)?;

    fs::create_dir_all(&dst)?;

    let mut copied_count = 0;
    copy_dir_all_with_progress_internal(&src, &dst, &method, &tx, &mut copied_count, total_files)?;

    // Send finished status
    let _ = channel::blocking_send(
        &tx,
        scope,
        CopyDirProgress::Finished {
            copied: copied_count,
        },
    );

    Ok(())
}

/// Counts the number of files in the given directory and all subdirectories.
pub fn count_files_recursively<P: AsRef<Path>>(path: P) -> io::Result<usize> {
    let mut count = 0;
    for entry in fs::read_dir(path)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        if ty.is_dir() {
            count += count_files_recursively(entry.path())?;
        } else {
            count += 1;
        }
    }
    Ok(count)
}

/// Internal recursive function that handles the copying with progress reporting
#[function_name::named]
fn copy_dir_all_with_progress_internal<P1: AsRef<Path>, P2: AsRef<Path>>(
    src: P1,
    dst: P2,
    method: &CopyMethod,
    tx: &tokio::sync::mpsc::Sender<CopyDirProgress>,
    copied_count: &mut usize,
    total_files: usize,
) -> io::Result<()> {
    let scope = function_name!();

    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        let file_name = entry.file_name();

        let src_path = entry.path();
        let dst_path = dst.as_ref().join(&file_name);

        if ty.is_dir() {
            fs::create_dir_all(&dst_path)?;
            copy_dir_all_with_progress_internal(
                &src_path,
                &dst_path,
                method,
                tx,
                copied_count,
                total_files,
            )?;
        } else {
            // Send progress update:
            let _ = channel::try_send(
                tx,
                scope,
                CopyDirProgress::Copying {
                    file_name: file_name.to_string_lossy().into_owned(),
                    copied: *copied_count,
                    total: total_files,
                },
            );

            // Copy file, then update copied count:
            copy_or_link(src_path, dst_path, method.clone())?;
            *copied_count += 1;
        }
    }
    Ok(())
}

/// Reads the entire contents of a file into a `Vec<u8>` buffer.
/// This is a convenience function for using `File::open` and `read_to_end`.
pub fn read_to_bytes<P: AsRef<Path>>(path: P) -> io::Result<Vec<u8>> {
    let mut file = File::open(path)?;
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer)?;
    Ok(buffer)
}

/// Writes the string to a file, creating one if it doesn't exist yet.
/// This is a convenience function for using `OpenOptions::open` and `write!`.
pub fn write_to_file<P: AsRef<Path>, S: AsRef<str>>(path: P, content: S) -> io::Result<()> {
    let file = fs::OpenOptions::new()
        .write(true)
        .create(true)
        .truncate(true)
        .open(path)?;
    write!(&file, "{}", content.as_ref())?;
    Ok(())
}

/// Returns `Ok(true)` if the path points to an existing directory that is empty.
pub fn is_empty<P: AsRef<Path>>(path: P) -> io::Result<bool> {
    Ok(fs::read_dir(path)?.next().is_none())
}

/// Deletes empty directories starting from the given path.
/// If the parent directory becomes empty after deletion, it will also be deleted,
/// and so on up the directory tree.
pub fn remove_empty_dirs<P: AsRef<Path>>(path: P) -> io::Result<()> {
    let mut current = path.as_ref().to_path_buf();
    while current.exists() && current.is_dir() && is_empty(&current)? {
        fs::remove_dir(&current)?;
        current = match current.parent() {
            Some(p) => p.to_path_buf(),
            None => break,
        };
    }
    Ok(())
}

/// Returns an iterator over the entries within a directory.
///
/// This function will return an error if the provided path doesn't exist,
/// isn't a directory or if the process lacks permissions to access it.
/// All subsequent errors that are returned by the ReadDir iterator are ignored and filtered out.
pub fn list_entries<P: AsRef<Path>>(path: P) -> io::Result<Box<dyn Iterator<Item = PathBuf>>> {
    Ok(Box::new(
        fs::read_dir(path)?
            .filter_map(|entry| entry.ok())
            .map(|entry| entry.path()),
    ))
}

/// Returns an iterator over the subdirectories within a directory.
pub fn list_directories<P: AsRef<Path>>(path: P) -> io::Result<Box<dyn Iterator<Item = PathBuf>>> {
    Ok(Box::new(
        fs::read_dir(path)?
            .filter_map(|entry| entry.ok())
            .map(|entry| entry.path())
            .filter(|path| path.is_dir()),
    ))
}

/// Returns an iterator over the files within a directory.
pub fn list_files<P: AsRef<Path>>(path: P) -> io::Result<Box<dyn Iterator<Item = PathBuf>>> {
    Ok(Box::new(
        fs::read_dir(path)?
            .filter_map(|entry| entry.ok())
            .map(|entry| entry.path())
            .filter(|path| path.is_file()),
    ))
}

/// Returns all file and folder paths within a directory and all it's subdirectories.
///
/// This function will return an error if the provided path doesn't exist,
/// isn't a directory or if the process lacks permissions to access it.
/// All subsequent errors that are returned by the ReadDir iterator are ignored and filtered out.
pub fn list_entries_recursively<P: AsRef<Path>>(
    path: P,
    max_depth: i32,
) -> io::Result<Vec<PathBuf>> {
    if max_depth < 0 {
        return Ok(Vec::new());
    }
    let mut paths: Vec<PathBuf> = Vec::new();
    for entry in fs::read_dir(path)? {
        let entry = entry?;
        let path = entry.path();
        paths.push(path.clone());
        if path.is_dir() {
            paths.append(&mut list_entries_recursively(&path, max_depth - 1)?);
        }
    }
    Ok(paths)
}

/// Returns all files paths within a directory and all it's subdirectories.
///
/// This function will return an error if the provided path doesn't exist,
/// isn't a directory or if the process lacks permissions to access it.
/// All subsequent errors that are returned by the ReadDir iterator are ignored and filtered out.
pub fn list_files_recursively<P: AsRef<Path>>(path: P, max_depth: i32) -> io::Result<Vec<PathBuf>> {
    if max_depth < 0 {
        return Ok(Vec::new());
    }
    let mut paths: Vec<PathBuf> = Vec::new();
    for entry in fs::read_dir(path)? {
        let entry = entry?;
        let path = entry.path();
        if path.is_dir() {
            paths.append(&mut list_files_recursively(&path, max_depth - 1)?);
        } else {
            paths.push(path);
        }
    }
    Ok(paths)
}

/// Returns an iterator over the files with a specific extension within a directory.
pub fn list_files_with_ext<P: AsRef<Path>, S: AsRef<str>>(
    path: P,
    ext: S,
) -> io::Result<Box<dyn Iterator<Item = PathBuf>>> {
    let ext = ext.as_ref().to_lowercase().to_owned();
    Ok(Box::new(
        fs::read_dir(path)?
            .filter_map(|entry| entry.ok())
            .map(|entry| entry.path())
            .filter(|path| path.is_file())
            .filter(move |path| {
                ext == path
                    .extension()
                    .and_then(OsStr::to_str)
                    .map(|str| str.to_lowercase())
                    .unwrap_or_default()
            }),
    ))
}

/// Returns an iterator over the files with specific extensions within a directory.
pub fn list_files_with_static_exts<P: AsRef<Path>>(
    path: P,
    ext: &'static [&'static str],
) -> io::Result<Box<dyn Iterator<Item = PathBuf>>> {
    Ok(Box::new(
        fs::read_dir(path)?
            .filter_map(|entry| entry.ok())
            .map(|entry| entry.path())
            .filter(|path| path.is_file())
            .filter(move |path| {
                ext.contains(
                    &path
                        .extension()
                        .and_then(OsStr::to_str)
                        .map(|str| str.to_lowercase())
                        .unwrap_or_default()
                        .as_str(),
                )
            }),
    ))
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

    result
}
