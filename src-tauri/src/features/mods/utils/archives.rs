use std::collections::HashMap;
use std::fs;

use camino::Utf8Path;
use camino::Utf8PathBuf;
use serde::{Deserialize, Serialize};
use specta::Type;

use crate::features::mods::models::json::ModInstallationState;

#[derive(Debug, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DeployedArchive {
    /// The UUID of the managed mod
    mod_id: String,
    /// The file name of the deployed *.ba2 archive
    archive_name: String,
}

#[derive(Debug, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ArchiveFileInfo {
    /// The file name of the archive, as passed in `archive_names`
    pub name: String,
    /// Whether the archive exists as a file in the game's Data folder
    pub exists: bool,
    /// The file size in number of bytes, formatted as string because the numbers might get too large for a `u32`.
    /// Only set if the file exists.
    pub file_size: Option<String>,
}

/// Returns existence and file size of each archive name, resolved against the game's Data folder.
pub fn get_archive_file_infos(
    data_path: &Utf8Path,
    archive_names: &[String],
) -> Vec<ArchiveFileInfo> {
    archive_names
        .iter()
        .map(|name| {
            let metadata = fs::metadata(data_path.join(name))
                .ok()
                .filter(|metadata| metadata.is_file());
            ArchiveFileInfo {
                name: name.clone(),
                exists: metadata.is_some(),
                file_size: metadata.map(|metadata| metadata.len().to_string()),
            }
        })
        .collect()
}

/// Returns all *.ba2 file names that are currently deployed by a mod.
/// If multiple mods deploy the same archive, only the last one (highest precedence) is kept.
pub fn get_deployed_archives(
    state: &[ModInstallationState],
) -> anyhow::Result<Vec<DeployedArchive>> {
    let mut archives: HashMap<String, DeployedArchive> = HashMap::new();

    // For each installed mod:
    for r#mod in state {
        // Iterate over it's files:
        for file in r#mod.files.iter() {
            // Construct a path relative to the game's directory (prepend root folder):
            let relative_path = if r#mod.root_folder.is_empty()
                || r#mod.root_folder == "."
                || r#mod.root_folder == "./"
                || r#mod.root_folder == ".\\"
            {
                Utf8PathBuf::from(file)
            } else {
                Utf8PathBuf::from(&r#mod.root_folder).join(file)
            };

            // Get the parent folder name:
            let Some(folder_name) = relative_path.parent().and_then(|p| p.file_name()) else {
                continue;
            };

            // Get the file name:
            let Some(file_name) = relative_path.file_name() else {
                continue;
            };

            // Get the file extension:
            let Some(file_ext) = relative_path.extension() else {
                continue;
            };

            // Check if it's in the "Data" folder:
            if folder_name.to_lowercase() != "data" {
                continue;
            }

            // Check if it ends on ".ba2":
            if file_ext.to_lowercase() != "ba2" {
                continue;
            }

            // Store the archive, overwriting any previous entry with the same name:
            archives.insert(
                file_name.to_string(),
                DeployedArchive {
                    mod_id: r#mod.key.clone(),
                    archive_name: file_name.to_string(),
                },
            );
        }
    }

    Ok(archives.into_values().collect())
}
