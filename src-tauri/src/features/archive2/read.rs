use std::fs::File;
use std::io::{self, Read, Seek, SeekFrom};
use std::path::Path;
use thiserror::Error;

use super::models::{Archive2Compression, Archive2Format, Archive2Info};

pub type Archive2ReadResult<T> = Result<T, Archive2ReadError>;

#[derive(Error, Debug, strum::AsRefStr)]
pub enum Archive2ReadError {
    #[error("Invalid Archive2 file: Expected 'BTDX' magic number, got '{0}'")]
    InvalidMagic(String),
    #[error("Couldn't read Archive2 file: Unknown format '{0}', expected GNRL or DX10")]
    UnknownFormat(String),
    #[error("Couldn't read Archive2 file: Number of files is 0 or less. Empty archive?")]
    EmptyArchive,
    #[error("Couldn't read Archive2 file: XBoxDDS and GNF types not implemented")]
    NotImplemented,
    #[error("IO error: {0}")]
    Io(#[from] io::Error),
    #[error("UTF8 error: {0}")]
    Utf8(#[from] std::string::FromUtf8Error),
}

/// Reads an Archive2 file (*.ba2) from a path and tries to determine format and compression.
pub fn read_archive2<P: AsRef<Path>>(path: P) -> Archive2ReadResult<Archive2Info> {
    let mut file = File::open(path)?;
    read_archive2_from_reader(&mut file)
}

/// Reads an Archive2 file (*.ba2) from a reader that implements `Seek` and tries to determine format and compression.
pub fn read_archive2_from_reader<R: Read + Seek>(
    reader: &mut R,
) -> Archive2ReadResult<Archive2Info> {
    // Checking magic number:
    let mut b_magic = [0u8; 4];
    reader.seek(SeekFrom::Start(0x00))?;
    reader.read_exact(&mut b_magic)?;
    let s_magic = String::from_utf8(b_magic.to_vec())?
        .trim_end_matches('\0')
        .to_string();

    if s_magic != "BTDX" {
        return Err(Archive2ReadError::InvalidMagic(s_magic));
    }

    // Reading format ("GNRL" or "DX10"):
    let mut b_format = [0u8; 4];
    reader.seek(SeekFrom::Start(0x08))?;
    reader.read_exact(&mut b_format)?;
    let s_format = String::from_utf8(b_format.to_vec())?
        .trim_end_matches('\0')
        .to_uppercase();

    let format = match s_format.as_str() {
        "GNRL" => Archive2Format::General,
        "DX10" => Archive2Format::DDS,
        _ => return Err(Archive2ReadError::UnknownFormat(s_format)),
    };

    // Reading number of files:
    let mut b_num_files = [0u8; 4];
    reader.seek(SeekFrom::Start(0x0C))?;
    reader.read_exact(&mut b_num_files)?;
    let num_of_files = u32::from_le_bytes(b_num_files);

    if num_of_files == 0 {
        return Err(Archive2ReadError::EmptyArchive);
    }

    // Determining Compression:
    // (Reading pack and full size of the first file in the archive.
    //  Trying to detect compression by looking at pack and full size.)
    let mut compression = Archive2Compression::None;

    match format {
        Archive2Format::General => {
            // Seek to first file record: 0x18 (header) + 0x18 (offset into record for size)
            reader.seek(SeekFrom::Start(0x30))?;
            let mut b_pack_size = [0u8; 4];
            reader.read_exact(&mut b_pack_size)?;
            let pack_size = u32::from_le_bytes(b_pack_size);

            if pack_size > 0 {
                compression = Archive2Compression::Default;
            }
        }
        Archive2Format::DDS => {
            // Seek to first file record: 0x18 (header) + 0x18 + 0x08 (offset for DDS)
            reader.seek(SeekFrom::Start(0x38))?;
            let mut b_sizes = [0u8; 8]; // Read pack and full size at once
            reader.read_exact(&mut b_sizes)?;

            let pack_size = u32::from_le_bytes(b_sizes[0..4].try_into().unwrap());
            let full_size = u32::from_le_bytes(b_sizes[4..8].try_into().unwrap());

            if pack_size != 0 || full_size != 0 {
                compression = Archive2Compression::Default;
            }
        }
        Archive2Format::XBoxDDS => return Err(Archive2ReadError::NotImplemented),
        Archive2Format::GNF => return Err(Archive2ReadError::NotImplemented),
    }

    Ok(Archive2Info {
        format,
        compression,
        num_of_files,
    })
}
