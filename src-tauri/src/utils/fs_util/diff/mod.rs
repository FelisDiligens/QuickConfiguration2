#[cfg(test)]
mod tests;

use std::fs::File;
use std::io::{self, Read, Seek, SeekFrom};
use std::path::Path;

const BUFFER_SIZE: usize = 65536;

/// Compare two files by their file size and content,
/// returning `Ok(true)` if both files are identical and `Ok(false)` if the files differ.
pub fn files_equal<P1, P2>(path_a: P1, path_b: P2) -> io::Result<bool>
where
    P1: AsRef<Path>,
    P2: AsRef<Path>,
{
    let size_a = path_a.as_ref().metadata()?.len();
    let size_b = path_b.as_ref().metadata()?.len();

    if size_a != size_b {
        return Ok(false);
    }

    let mut file_a = File::open(path_a)?;
    let mut file_b = File::open(path_b)?;

    let mut buf_a = [0; BUFFER_SIZE];
    let mut buf_b = [0; BUFFER_SIZE];

    if size_a > 4096 {
        file_a.seek(SeekFrom::End(-4096))?;
        file_b.seek(SeekFrom::End(-4096))?;
        let read_a = read_full(&mut file_a, &mut buf_a)?;
        let read_b = read_full(&mut file_b, &mut buf_b)?;
        if read_a != read_b {
            return Ok(false);
        }
        if buf_a[0..read_a] != buf_b[0..read_b] {
            return Ok(false);
        }
        file_a.seek(SeekFrom::Start(0))?;
        file_b.seek(SeekFrom::Start(0))?;
    }

    loop {
        let read_a = read_full(&mut file_a, &mut buf_a)?;
        let read_b = read_full(&mut file_b, &mut buf_b)?;
        if read_a == 0 || read_b == 0 {
            return Ok(true);
        }
        if read_a != read_b {
            return Ok(false);
        }
        if buf_a[0..read_a] != buf_b[0..read_b] {
            return Ok(false);
        }
    }
}

fn read_full<R: Read>(reader: &mut R, buffer: &mut [u8]) -> io::Result<usize> {
    let mut total = 0;
    while total < buffer.len() {
        match reader.read(&mut buffer[total..])? {
            0 => break,
            n => total += n,
        }
    }
    Ok(total)
}
