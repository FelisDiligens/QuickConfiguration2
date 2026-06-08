use std::path::Path;

use camino::{Utf8Path, Utf8PathBuf};
use serde::{Deserialize, Serialize};
use specta::Type;

use crate::{
    features::mods::{errors::ModActionResult, installation::DirEntry, models::json::ManagedMod},
    utils::fs_util,
};

pub const TEXT_FILE_EXTENSIONS: &[&str] =
    &["txt", "md", "rst", "html", "rtf", "doc", "docx", "pdf"];
pub const CONFIG_FILE_EXTENSIONS: &[&str] = &[
    "ini", "json", "jsonc", "yaml", "xml", "toml", "conf", "config",
];
pub const LIBRARY_FILE_EXTENSIONS: &[&str] = &["dll", "o", "so"];
pub const PROGRAM_FILE_EXTENSIONS: &[&str] = &["exe", "pdb", "dll", "o", "so"];
pub const IMAGE_FILE_EXTENSIONS: &[&str] =
    &["jpg", "jpeg", "png", "webp", "gif", "bmp", "jfif", "jxl"];
pub const STRINGS_FILE_EXTENSIONS: &[&str] = &["dlstrings", "ilstrings", "strings"];
pub const EXCLUDED_FILES: &[&str] = &[
    "fallout76.ini",
    "fallout76prefs.ini",
    "fallout76custom.ini",
    "license",
];

pub const RESOURCE_FOLDERS: &[&str] = &[
    "meshes",
    "strings",
    "music",
    "sound",
    "textures",
    "materials",
    "interface",
    "geoexporter",
    "programs",
    "vis",
    "scripts",
    "misc",
    "shadersfx",
    "lodsettings",
    "video",
];
pub const GENERAL_FOLDERS: &[&str] = &["meshes", "materials"];
pub const TEXTURE_FOLDERS: &[&str] = &["textures", "effects"];
pub const SOUND_FOLDERS: &[&str] = &["sound", "music"];
pub const INTERFACE_FOLDERS: &[&str] = &["interface", "programs"];
pub const STRINGS_FOLDERS: &[&str] = &["strings"];

#[derive(Serialize, Deserialize, Debug, Clone, Type)]
#[serde(rename_all = "kebab-case")]
pub enum DiagnosticIssue {
    /// The mod folder is empty
    EmptyFolder,
    /// The folder isn't empty but contains no files that are considered to be part of a mod.
    /// e.g. it only contains text, config, image files, or excluded files.
    NoModFilesFound,
    /// Archives (BA2 files) are not being deployed to `./Data/`
    WrongFolderForArchives,
    /// String files (STRINGS, DLSTRINGS, ILSTRINGS) are not being deployed to `./Data/Strings/`
    WrongFolderForStrings,
    /// DLL files are not being deployed to `.` (root)
    WrongFolderForDlls,
    /// Multiple folders contain BA2 files. This usually indicates that the user has to choose from one or more options.
    /// e.g. if it's a map texture replacer, the user may choose between different maps, etc.
    #[serde(rename = "multiple-ba2-roots")]
    MultipleBA2Roots,
    /// Found folders that usually belong in a BA2 archive, e.g. if the folder "meshes" folder was found.
    /// This usually indicates that the files have to be packed into an archive, be loaded using a tool like BakaFileLoader, or be merged into an existing game's archive (e.g. `SeventySix - Animations.ba2`).
    /// (This excludes the "strings" folder, which has to be put into the Data folder directly without being packed.)
    UnpackedFiles,
}

pub fn uncheck_unneeded_entries(contents: Vec<DirEntry>) -> Vec<String> {
    let mut paths = Vec::new();
    for entry in contents {
        match entry {
            DirEntry::File { path, name } => {
                let enabled = !(TEXT_FILE_EXTENSIONS
                    .iter()
                    .any(|ext| name.to_lowercase().ends_with(&format!(".{}", ext)))
                    || IMAGE_FILE_EXTENSIONS
                        .iter()
                        .any(|ext| name.to_lowercase().ends_with(&format!(".{}", ext)))
                    || EXCLUDED_FILES
                        .iter()
                        .any(|&file| name.to_lowercase() == file));
                if enabled {
                    paths.push(path);
                }
            }
            DirEntry::Folder { contents, .. } => {
                paths.append(&mut uncheck_unneeded_entries(contents));
            }
        }
    }
    paths
}

pub fn detect_root_folder<P: AsRef<Path>>(mod_path: P) -> ModActionResult<String> {
    let mod_path: &Utf8Path = mod_path.as_ref().try_into()?;

    // Bail early if the mod folder is empty:
    if fs_util::is_empty(mod_path)? {
        return Ok(".".to_string());
    }

    // DLL files in root                     => return "."
    // BA2 files in root                     => return "Data"
    // BA2 files in "Data" folder            => return "."
    // String files in root                  => return "Data/Strings"
    // String files in "Strings" folder      => return "Data"
    // String files in "Data/Strings" folder => return "."

    let entries: Vec<Utf8PathBuf> = fs_util::list_entries_recursively(mod_path, 50)?
        .into_iter()
        .map(|p| p.try_into())
        .collect::<Result<_, _>>()?;

    let has_dll_in_root = entries.iter().any(|entry| {
        entry.is_file()
            && entry.parent() == Some(mod_path)
            && LIBRARY_FILE_EXTENSIONS.contains(
                &entry
                    .extension()
                    .unwrap_or_default()
                    .to_lowercase()
                    .as_str(),
            )
    });

    if has_dll_in_root {
        return Ok(".".to_string());
    }

    let has_ba2_in_root = entries.iter().any(|entry| {
        entry.is_file()
            && entry.parent() == Some(mod_path)
            && entry.extension().unwrap_or_default().to_lowercase() == "ba2"
    });

    if has_ba2_in_root {
        return Ok("Data".to_string());
    }

    let has_ba2_in_data = entries.iter().any(|entry| {
        entry.is_file()
            && entry.extension().unwrap_or_default().to_lowercase() == "ba2"
            && entry
                .parent()
                .map(|p| p.file_name().unwrap_or_default().to_lowercase())
                == Some("data".to_string())
            && entry.parent().and_then(|p| p.parent()) == Some(mod_path)
    });

    if has_ba2_in_data {
        return Ok(".".to_string());
    }

    let has_strings_in_root = entries.iter().any(|entry| {
        entry.is_file()
            && entry.parent() == Some(mod_path)
            && STRINGS_FILE_EXTENSIONS.contains(
                &entry
                    .extension()
                    .unwrap_or_default()
                    .to_lowercase()
                    .as_str(),
            )
    });

    if has_strings_in_root {
        return Ok("Data/Strings".to_string());
    }

    let has_strings_in_strings = entries.iter().any(|entry| {
        entry.is_file()
            && STRINGS_FILE_EXTENSIONS.contains(
                &entry
                    .extension()
                    .unwrap_or_default()
                    .to_lowercase()
                    .as_str(),
            )
            && entry
                .parent()
                .map(|p| p.file_name().unwrap_or_default().to_string().to_lowercase())
                == Some("strings".to_string())
            && entry.parent().and_then(|p| p.parent()) == Some(mod_path)
    });

    if has_strings_in_strings {
        return Ok("Data".to_string());
    }

    let has_strings_in_data_strings = entries.iter().any(|entry| {
        entry.is_file()
            && STRINGS_FILE_EXTENSIONS.contains(
                &entry
                    .extension()
                    .unwrap_or_default()
                    .to_lowercase()
                    .as_str(),
            )
            && entry
                .parent()
                .map(|p| p.file_name().unwrap_or_default().to_string().to_lowercase())
                == Some("strings".to_string())
            && entry
                .parent()
                .and_then(|p| p.parent())
                .map(|p| p.file_name().unwrap_or_default().to_string().to_lowercase())
                == Some("data".to_string())
            && entry
                .parent()
                .and_then(|p| p.parent())
                .and_then(|p| p.parent())
                == Some(mod_path)
    });

    if has_strings_in_data_strings {
        return Ok(".".to_string());
    }

    Ok(".".to_string())
}

pub fn diagnose_issues<P: AsRef<Path>>(
    mod_details: ManagedMod,
    mod_path: P,
) -> ModActionResult<Vec<DiagnosticIssue>> {
    let mut issues: Vec<DiagnosticIssue> = Vec::new();

    let mod_path: &Utf8Path = mod_path.as_ref().try_into()?;
    let root_folder = mod_details.options.root_folder;

    // Bail early if the mod folder is empty:
    if fs_util::is_empty(mod_path)? {
        return Ok(vec![DiagnosticIssue::EmptyFolder]);
    }

    let mut ba2_files: Vec<Utf8PathBuf> = Vec::new();
    let mut ba2_parent_folders: Vec<Utf8PathBuf> = Vec::new();
    let mut strings_files: Vec<Utf8PathBuf> = Vec::new();
    let mut dll_files: Vec<Utf8PathBuf> = Vec::new();
    let mut resource_folders: Vec<String> = Vec::new();
    let mut mod_files_found = false;

    for entry in fs_util::list_entries_recursively(mod_path, 50)? {
        let entry: Utf8PathBuf = entry.try_into()?;
        let Some(basename) = entry.file_name() else {
            continue;
        };
        let basename_str = basename.to_string().to_lowercase();
        let file_ext = entry.extension().unwrap_or_default().to_lowercase();

        if entry.is_file() {
            // Check if this is a mod file (not text/config/image/excluded)
            if !TEXT_FILE_EXTENSIONS.contains(&file_ext.as_str())
                && !CONFIG_FILE_EXTENSIONS.contains(&file_ext.as_str())
                && !IMAGE_FILE_EXTENSIONS.contains(&file_ext.as_str())
                && !EXCLUDED_FILES.contains(&basename_str.as_str())
            {
                mod_files_found = true;
            }

            // Track BA2 files
            if file_ext == "ba2" {
                ba2_files.push(entry.clone());
                if let Some(parent) = entry.parent() {
                    ba2_parent_folders.push(parent.to_path_buf());
                }
            }

            // Track strings files
            if STRINGS_FILE_EXTENSIONS.contains(&file_ext.as_str()) {
                strings_files.push(entry.clone());
            }

            // Track DLL files
            if PROGRAM_FILE_EXTENSIONS.contains(&file_ext.as_str()) {
                dll_files.push(entry.clone());
            }
        } else if entry.is_dir() {
            // Track resource folders (excluding strings which is special)
            if RESOURCE_FOLDERS.contains(&basename_str.as_str()) && basename_str != "strings" {
                resource_folders.push(basename_str);
            }
        }
    }

    if !mod_files_found {
        issues.push(DiagnosticIssue::NoModFilesFound);
    }

    // Check BA2 files destination
    // BA2 files should end up directly in Data/ folder (not in subfolders of Data)
    // With root_folder=R and ba2 at relative path P, destination is R/P
    let mut has_wrong_folder_for_archives = false;
    if !ba2_files.is_empty() {
        for ba2_file in &ba2_files {
            let rel_path: Utf8PathBuf =
                fs_util::get_relative_path(mod_path, ba2_file)?.try_into()?;
            let dest = Utf8PathBuf::from(&root_folder).join(&rel_path);
            // Normalize to forward slashes for cross-platform compatibility
            let dest_str = dest.to_string().to_lowercase().replace('\\', "/");
            // Remove leading "./" if present
            let dest_str = dest_str.strip_prefix("./").unwrap_or(&dest_str);

            // BA2 should be directly in Data folder
            // So destination should be "data/<filename>.ba2" or just "data" (for directory)
            // But not "data/something/file.ba2" or "file.ba2" or "other/file.ba2"
            if !dest_str.starts_with("data/") {
                // Doesn't start with data/ at all - wrong folder
                has_wrong_folder_for_archives = true;
                break;
            } else {
                // Starts with "data/", but we need to check if there's a subfolder
                // e.g., "data/data/file.ba2" or "data/somefolder/file.ba2" are wrong
                // Only "data/file.ba2" is correct
                let after_data = &dest_str[5..]; // Skip "data/"
                if after_data.contains('/') {
                    has_wrong_folder_for_archives = true;
                    break;
                }
            }
        }
    }
    if has_wrong_folder_for_archives {
        issues.push(DiagnosticIssue::WrongFolderForArchives);
    }

    // Check for multiple BA2 roots
    // Dedup parent folders and check if there are multiple distinct ones
    let unique_ba2_parents: std::collections::HashSet<_> = ba2_parent_folders
        .iter()
        .map(|p| p.to_string().to_lowercase())
        .collect();
    let has_multiple_ba2_roots = unique_ba2_parents.len() > 1;
    if has_multiple_ba2_roots {
        issues.push(DiagnosticIssue::MultipleBA2Roots);
    }

    // Check strings files destination
    // Strings files should end up directly in Data/Strings/ folder
    let mut has_wrong_folder_for_strings = false;
    if !strings_files.is_empty() {
        for str_file in &strings_files {
            let rel_path: Utf8PathBuf =
                fs_util::get_relative_path(mod_path, str_file)?.try_into()?;
            let dest = Utf8PathBuf::from(&root_folder).join(&rel_path);
            // Normalize to forward slashes for cross-platform compatibility
            let dest_str = dest.to_string().to_lowercase().replace('\\', "/");
            let dest_str = dest_str.strip_prefix("./").unwrap_or(&dest_str);

            // Strings should be directly in Data/Strings folder
            // So destination should be "data/strings/<filename>"
            // Not "data/strings/something/file" or "strings/file" or "data/file"
            if !dest_str.starts_with("data/strings/") {
                has_wrong_folder_for_strings = true;
                break;
            } else {
                // Check if there's a subfolder after "data/strings/"
                let after_strings = &dest_str[13..]; // Skip "data/strings/"
                if after_strings.contains('/') {
                    has_wrong_folder_for_strings = true;
                    break;
                }
            }
        }
    }
    if has_wrong_folder_for_strings {
        issues.push(DiagnosticIssue::WrongFolderForStrings);
    }

    // Check DLL files destination
    // DLL files should end up in root (.)
    let mut has_wrong_folder_for_dlls = false;
    if !dll_files.is_empty() {
        for dll_file in &dll_files {
            let rel_path: Utf8PathBuf =
                fs_util::get_relative_path(mod_path, dll_file)?.try_into()?;
            let dest = Utf8PathBuf::from(&root_folder).join(&rel_path);
            // Normalize to forward slashes for cross-platform compatibility
            let dest_str = dest.to_string().to_lowercase().replace('\\', "/");
            let dest_str = dest_str.strip_prefix("./").unwrap_or(&dest_str);

            // DLL should be in root (.), so destination should be just the filename (no path separators)
            // If it contains a path separator or starts with "data/", it's wrong
            if dest_str.contains('/') || dest_str.starts_with("data/") {
                has_wrong_folder_for_dlls = true;
                break;
            }
        }
    }
    if has_wrong_folder_for_dlls {
        issues.push(DiagnosticIssue::WrongFolderForDlls);
    }

    // Check for unpacked files (resource folders that should be in BA2)
    if !resource_folders.is_empty() {
        issues.push(DiagnosticIssue::UnpackedFiles);
    }

    Ok(issues)
}

// pub fn fix_wrong_folder<P: AsRef<Path>>(issue: DiagnosticIssue) -> String {
//     match issue {
//         DiagnosticIssue::WrongFolderForArchives => "Data".to_string(),
//         DiagnosticIssue::WrongFolderForStrings => "Data/Strings".to_string(),
//         DiagnosticIssue::WrongFolderForDlls => ".".to_string(),
//         _ => todo!(),
//     }
// }
