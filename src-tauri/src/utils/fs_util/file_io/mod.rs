#[cfg(test)]
mod tests;

use std::fs::{self, File};
use std::io::{self, Read, Write};
use std::path::Path;

use crate::utils::fs_util::fs_ops::move_file;

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

/// Writes the string to a file atomically: writes to a temporary file in the same
/// directory first, then renames it over the target file.
pub fn write_atomic<P: AsRef<Path>, S: AsRef<str>>(path: P, content: S) -> io::Result<()> {
    let path = path.as_ref();
    let tmp_path = path.with_added_extension("tmp");
    write_to_file(&tmp_path, content)?;
    move_file(&tmp_path, path)
}
