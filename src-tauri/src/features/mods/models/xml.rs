//! Legacy XML format (from v1) to save the state of managed mods.

use serde::{Deserialize, Serialize};

use crate::features::nexusmods;

use super::json;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ManagedMods {
    #[serde(rename = "@enabled")]
    pub enabled: bool,
    #[serde(rename = "@nwmode")]
    pub nuclear_winter_mode: bool,
    #[serde(rename = "Mod")]
    pub mods: Vec<ManagedMod>,
}

/// Represents a managed mod. Stores information about the mod and how it's installed.
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ManagedMod {
    /// A guid that uniquely identifies the mod.
    #[serde(rename = "@guid")]
    pub guid: String,
    #[serde(rename = "Title")]
    pub title: String,
    /// Get the folder name (not path). This folder stores the mod's files.
    #[serde(rename = "Folder")]
    pub folder: String,
    #[serde(rename = "Version")]
    pub version: String,
    #[serde(rename = "NexusMods")]
    pub nexusmods: ModNexusMods,
    #[serde(rename = "DiskState")]
    pub state: ModDiskState,
    /// The user's notes about the mod.
    #[serde(rename = "Notes")]
    pub notes: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ModNexusMods {
    #[serde(rename = "@id")]
    pub id: i32,
    #[serde(rename = "URL")]
    pub url: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ModDiskState {
    #[serde(rename = "Current")]
    pub current: ModDiskStateCurrent,
    #[serde(rename = "Pending")]
    pub pending: ModDiskStatePending,
    #[serde(rename = "FrozenData")]
    pub frozen_data: ModDiskStateFrozenData,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ModDiskStateCurrent {
    /// Has it been deployed? Is it on disk?
    #[serde(rename = "@isDeployed")]
    pub deployed: bool,
    /// How the mod got installed. (Current disk state)
    #[serde(rename = "InstallationMethod")]
    pub installation_method: InstallationMethod,
    /// If deployed as SeparateBA2, what is the archive in Data called? (SeparateBA2)
    #[serde(rename = "ArchiveName")]
    pub archive_name: String,
    /// How the archive in Data is formatted.
    #[serde(rename = "ArchiveFormat")]
    pub archive_format: ArchiveFormat,
    /// How the archive in Data is compressed.
    #[serde(rename = "ArchiveCompression")]
    pub archive_compression: ArchiveCompression,
    /// The folder where loose files are currently copied to.
    #[serde(rename = "RootFolder")]
    pub root_folder: String,
    /// Relative paths of the mod files that are currently deployed.
    #[serde(rename = "InstalledLooseFiles")]
    pub installed_loose_files: InstalledLooseFiles,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct InstalledLooseFiles {
    #[serde(rename = "File")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub files: Option<Vec<LooseFile>>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LooseFile {
    #[serde(rename = "@path")]
    pub path: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ModDiskStatePending {
    /// Enabled for deployment: Whether we want to have this mod deployed or not.
    #[serde(rename = "@isEnabled")]
    pub enabled: bool,
    /// How the mod should get installed. (Pending disk state)
    #[serde(rename = "InstallationMethod")]
    pub installation_method: InstallationMethod,
    /// How is the archive going to be called after deployment? (SeparateBA2)
    #[serde(rename = "ArchiveName")]
    pub archive_name: String,
    /// How it should get formatted on deployment.
    #[serde(rename = "ArchiveFormat")]
    pub archive_format: ArchiveFormat,
    /// How it should get compressed on deployment.
    #[serde(rename = "ArchiveCompression")]
    pub archive_compression: ArchiveCompression,
    /// The folder where to copy loose files to on deployment.
    #[serde(rename = "RootFolder")]
    pub root_folder: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ModDiskStateFrozenData {
    /// Do we have a frozen archive for deployment? (SeparateBA2)
    #[serde(rename = "@isFrozen")]
    pub frozen: bool,
    /// Do we want to freeze this archive? Do we want to use a frozen archive if available? (SeparateBA2)
    #[serde(rename = "@freeze")]
    pub freeze: bool,
    /// How the archive in FrozenData is formatted.
    #[serde(rename = "ArchiveFormat")]
    pub archive_format: ArchiveFormat,
    /// How the archive in FrozenData is compressed.
    #[serde(rename = "ArchiveCompression")]
    pub archive_compression: ArchiveCompression,
}

/// How a mod should be deployed.
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
pub enum InstallationMethod {
    /// Copy files over without packing
    LooseFiles, // or "Loose",
    /// Bundle it with other mods in one package
    BundledBA2,
    /// Pack it as a separate *.ba2 archive
    SeparateBA2,
}

#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
pub enum ArchiveFormat {
    General,
    Textures,
    Auto,
}

#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
pub enum ArchiveCompression {
    Compressed,
    Uncompressed,
    Auto,
}

impl From<json::ManagedMods> for ManagedMods {
    fn from(value: json::ManagedMods) -> Self {
        Self {
            enabled: value.enabled,
            nuclear_winter_mode: false,
            mods: value
                .mods
                .iter()
                .map(|r#mod| ManagedMod::from(r#mod, value.get_mod_state(&r#mod.key)))
                .collect(),
        }
    }
}

impl ManagedMod {
    fn from(r#mod: &json::ManagedMod, state: Option<&json::ModInstallationState>) -> Self {
        Self {
            guid: r#mod.key.clone(),
            title: r#mod.title.clone(),
            folder: r#mod.folder_name.clone(),
            version: r#mod.version.clone(),
            nexusmods: ModNexusMods {
                id: nexusmods::models::api::ModID::URL(r#mod.url.clone())
                    .into_game_scoped_id()
                    .ok()
                    .and_then(|id| id.try_into().ok())
                    .unwrap_or(-1),
                url: r#mod.url.clone(),
            },
            state: ModDiskState {
                current: ModDiskStateCurrent {
                    deployed: state.is_some(),
                    installation_method: InstallationMethod::LooseFiles,
                    archive_name: "Unnamed".to_string(),
                    archive_format: ArchiveFormat::Auto,
                    archive_compression: ArchiveCompression::Auto,
                    root_folder: state
                        .as_ref()
                        .map(|state| state.root_folder.as_str())
                        .unwrap_or(".")
                        .to_owned(),
                    installed_loose_files: InstalledLooseFiles {
                        files: state.map(|state| &state.files).map(|files| {
                            files
                                .iter()
                                .map(|path| LooseFile { path: path.clone() })
                                .collect()
                        }),
                    },
                },
                pending: ModDiskStatePending {
                    enabled: r#mod.enabled,
                    installation_method: InstallationMethod::LooseFiles,
                    archive_name: "Unnamed".to_string(),
                    archive_format: ArchiveFormat::Auto,
                    archive_compression: ArchiveCompression::Auto,
                    root_folder: r#mod.options.root_folder.clone(),
                },
                frozen_data: ModDiskStateFrozenData {
                    frozen: false,
                    freeze: false,
                    archive_format: ArchiveFormat::Auto,
                    archive_compression: ArchiveCompression::Auto,
                },
            },
            notes: r#mod.notes.clone(),
        }
    }
}
