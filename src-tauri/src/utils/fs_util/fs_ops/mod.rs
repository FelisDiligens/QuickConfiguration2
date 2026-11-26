#[cfg(test)]
mod tests;

use std::fs::{self, File};
use std::io;
use std::path::Path;

use cfg_if::cfg_if;

use crate::utils::channel;
use crate::utils::fs_util::listing::{count_files_recursively, is_empty};

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

    // Try to canonicalize to get absolute paths with drive letters:
    let src = src.canonicalize().unwrap_or(src.to_path_buf());
    let dst = dst.canonicalize().unwrap_or(dst.to_path_buf());

    // Get the drive letter from both paths by checking the prefix component:
    let get_drive = |path: &Path| -> Option<String> {
        path.components().find_map(|c| match c {
            Component::Prefix(prefix) => {
                // Convert the prefix to a string for comparison:
                prefix
                    .as_os_str()
                    .to_str()
                    .map(|s| s.strip_prefix(r"\\?\").unwrap_or(s)) // "Convert" verbatim disk (\\?\C:) to DOS disk (C:)
                    .map(|s| s.to_uppercase()) // Ignore case
            }
            _ => None,
        })
    };

    let src_drive = get_drive(&src)?;
    let dst_drive = get_drive(&dst)?;

    Some(src_drive == dst_drive)
}

/// Checks if file is readonly.
pub fn is_file_readonly<P: AsRef<Path>>(file_path: P) -> io::Result<bool> {
    Ok(File::open(file_path.as_ref())?
        .metadata()?
        .permissions()
        .readonly())
}

/// Makes the file readonly or writable.
pub fn set_file_readonly<P: AsRef<Path>>(file_path: P, read_only: bool) -> io::Result<()> {
    let mut permissions = File::open(file_path.as_ref())?.metadata()?.permissions();
    permissions.set_readonly(read_only);
    fs::set_permissions(file_path.as_ref(), permissions)?;
    Ok(())
}

/// Copies/symlinks/hardlinks `src` to `dst`.
/// If the destination already exists, it will be deleted and replaced.
pub fn copy_or_link<P1: AsRef<Path>, P2: AsRef<Path>>(
    src: P1,
    dst: P2,
    method: CopyMethod,
) -> io::Result<()> {
    match method {
        CopyMethod::Copy => copy_file(src, dst),
        CopyMethod::Hardlink => hardlink_file(src, dst),
        CopyMethod::Symlink => symlink_file(src, dst),
    }
}

/// Copies `src` to `dst`.
/// If the destination already exists, it will be deleted and replaced.
#[inline]
pub fn copy_file<P1: AsRef<Path>, P2: AsRef<Path>>(src: P1, dst: P2) -> io::Result<()> {
    let dst_path = dst.as_ref();
    if dst_path.exists() {
        // Delete destination in case it's a hardlink:
        // > "Note that if from and to both point to the same file, then the file will likely get truncated by this operation."
        fs::remove_file(dst_path)?;
    }
    fs::copy(src.as_ref(), dst_path)?;
    Ok(())
}

/// Hardlinks `src` to `dst`, falling back to copying if hardlinking isn't possible
/// (e.g. when source and destination are on different filesystems).
/// If the destination already exists, it will be deleted and replaced.
#[inline]
pub fn hardlink_file<P1: AsRef<Path>, P2: AsRef<Path>>(src: P1, dst: P2) -> io::Result<()> {
    let src_path = src.as_ref();
    let dst_path = dst.as_ref();
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
            log::trace!(
                "Requested to hardlink {src_path:?} to {dst_path:?} but drive letters did not match: Falling back to copying."
            );
            return copy_file(src_path, dst_path);
        }
    }

    let result = fs::hard_link(src_path, dst_path);

    // On Windows, hardlinking may fail with ERROR_NOT_SAME_DEVICE (os error 17).
    // On Unix, hardlinking may fail with EXDEV ("Invalid cross-device link", os error 18).
    // Rust maps both to ErrorKind::CrossesDevices since 1.85.0.
    if let Err(ref error) = result
        && error.kind() == io::ErrorKind::CrossesDevices
    {
        // Fallback to copy if on different filesystems:
        log::trace!(
            "Attempted to hardlink {src_path:?} to {dst_path:?} but failed with OS error {:?}: Falling back to copying.",
            error.raw_os_error()
        );
        return copy_file(src_path, dst_path);
    }

    result
}

/// Symlinks `src` to `dst`.
/// If the destination already exists, it will be deleted and replaced.
#[inline]
pub fn symlink_file<P1: AsRef<Path>, P2: AsRef<Path>>(src: P1, dst: P2) -> io::Result<()> {
    let src_path = src.as_ref();
    let dst_path = dst.as_ref();
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
