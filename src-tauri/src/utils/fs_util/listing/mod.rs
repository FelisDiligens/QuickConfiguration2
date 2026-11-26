#[cfg(test)]
mod tests;

use std::ffi::OsStr;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};

/// Returns `Ok(true)` if the path points to an existing directory that is empty.
pub fn is_empty<P: AsRef<Path>>(path: P) -> io::Result<bool> {
    Ok(fs::read_dir(path)?.next().is_none())
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
