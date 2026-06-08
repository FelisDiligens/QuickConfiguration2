use windows::Win32::Foundation::MAX_PATH;
use windows::Win32::Storage::FileSystem::GetLogicalDriveStringsW;
use windows::Win32::System::WindowsProgramming::{
    DRIVE_CDROM, DRIVE_FIXED, DRIVE_NO_ROOT_DIR, DRIVE_RAMDISK, DRIVE_REMOTE, DRIVE_REMOVABLE,
    DRIVE_UNKNOWN,
};
use windows::{Win32::Storage::FileSystem::GetDriveTypeW, core::PCWSTR};

use crate::utils::windows::string_conv::StringConversions;

pub struct Drive {
    pub path: String,
    pub drive_type: DriveType,
}

#[derive(PartialEq)]
pub enum DriveType {
    /// The drive type cannot be determined.
    Unknown,
    /// The root path is invalid; for example, there is no volume mounted at the specified path.
    NoRootDir,
    /// The drive has removable media; for example, a floppy drive, thumb drive, or flash card reader.
    Removable,
    /// The drive has fixed media; for example, a hard disk drive or flash drive.
    Fixed,
    /// The drive is a remote (network) drive.
    Remote,
    /// The drive is a CD-ROM drive.
    CDRom,
    /// The drive is a RAM disk.
    RamDisk,
}

fn get_drive_type(root_path: Vec<u16>) -> DriveType {
    match unsafe { GetDriveTypeW(PCWSTR(root_path.as_ptr())) } {
        DRIVE_UNKNOWN => DriveType::Unknown,
        DRIVE_NO_ROOT_DIR => DriveType::NoRootDir,
        DRIVE_REMOVABLE => DriveType::Removable,
        DRIVE_FIXED => DriveType::Fixed,
        DRIVE_REMOTE => DriveType::Remote,
        DRIVE_CDROM => DriveType::CDRom,
        DRIVE_RAMDISK => DriveType::RamDisk,
        _ => panic!("Invalid return value"),
    }
}

pub fn get_drives() -> Result<Vec<Drive>, String> {
    // Prepare buffer for null-terminated wide (UTF-16) char array:
    let mut buffer = vec![0; MAX_PATH as usize];

    let res: u32 = unsafe { GetLogicalDriveStringsW(Some(buffer.as_mut_slice())) };

    // Success indicated by non 0 return value:
    if res == 0 {
        Err(String::from(
            "GetLogicalDriveStringsW failed: internal error",
        )) // GetLastError
    } else if res > buffer.len() as u32 {
        Err(String::from(
            "GetLogicalDriveStringsW failed: buffer size exceeded",
        ))
    } else {
        let mut drive_name: Vec<u16> = Vec::new();
        let mut drives: Vec<Drive> = Vec::new();
        for i in 0..res {
            let c = buffer[i as usize];
            drive_name.push(c);
            if c == 0 {
                drives.push(Drive {
                    path: drive_name.clone().decode_to_string(),
                    drive_type: get_drive_type(drive_name.clone()),
                });
                drive_name.clear();
            }
        }
        Ok(drives)
    }
}

pub fn get_filtered_drives() -> Vec<Drive> {
    match get_drives() {
        Ok(drives) => drives
            .into_iter()
            .filter(|d| d.drive_type == DriveType::Removable || d.drive_type == DriveType::Fixed)
            .collect(),
        Err(_) => Vec::new(),
    }
}
