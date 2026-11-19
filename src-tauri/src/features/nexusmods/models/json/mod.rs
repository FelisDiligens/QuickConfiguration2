//! New JSON formats for all NexusMods data.

mod account;
mod mod_info;

use std::str::FromStr;

pub use account::*;
pub use mod_info::*;

use serde::{Deserialize, Serialize};
use specta::Type;

use crate::features::nexusmods::models::api;

#[derive(Serialize, Deserialize, strum::Display, Type, Debug, PartialEq, Clone)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
#[strum(serialize_all = "SCREAMING_SNAKE_CASE")]
#[specta(rename = "NexusModsFileCategory")]
pub enum FileCategory {
    Main,
    Update,
    Optional,
    OldVersion,
    Miscellaneous,
    Archived,
}

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
#[serde(rename_all = "camelCase")]
#[specta(rename = "NexusModsFileUpdate")]
pub struct FileUpdate {
    pub old_file_id: u32,
    pub new_file_id: u32,
    pub old_file_name: String,
    pub new_file_name: String,
    #[specta(type = String)] // will be formatted as RFC3339
    pub uploaded_time: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
#[serde(rename_all = "camelCase")]
#[specta(rename = "NexusModsModFile")]
pub struct ModFile {
    pub id: Vec<u32>,
    pub uid: u32,
    pub file_id: u32,
    pub name: String,
    pub version: String,
    pub category_id: u32,
    pub category_name: Option<String>,
    pub category: Option<FileCategory>,
    pub is_primary: bool,
    pub size: u32,
    pub file_name: String,
    #[specta(type = String)] // will be formatted as RFC3339
    pub uploaded_time: chrono::DateTime<chrono::Utc>,
    pub mod_version: String,
    pub external_virus_scan_url: Option<String>,
    pub description: String,
    pub size_kb: u32,
    pub size_in_bytes: Option<String>, // integer as a string (cannot serialize u64)
    pub changelog_html: Option<String>,
    pub content_preview_link: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
#[serde(rename_all = "camelCase")]
#[specta(rename = "NexusModsModFiles")]
pub struct ModFiles {
    pub file_updates: Vec<FileUpdate>,
    pub files: Vec<ModFile>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
#[serde(rename_all = "camelCase")]
#[specta(rename = "NexusModsDownloadLink")]
pub struct DownloadLink {
    pub name: String,
    pub short_name: String,
    pub uri: String,
}

impl From<api::FileUpdate> for FileUpdate {
    fn from(value: api::FileUpdate) -> Self {
        Self {
            old_file_id: value.old_file_id,
            new_file_id: value.new_file_id,
            old_file_name: value.old_file_name,
            new_file_name: value.new_file_name,
            uploaded_time: value.uploaded_time,
        }
    }
}

impl From<api::ModFile> for ModFile {
    fn from(value: api::ModFile) -> Self {
        Self {
            id: value.id,
            uid: value.uid as u32,
            file_id: value.file_id,
            name: value.name,
            version: value.version,
            category: value
                .category_name
                .as_ref()
                .and_then(|name| FileCategory::from_str(name.as_str()).ok()),
            category_id: value.category_id,
            category_name: value.category_name,
            is_primary: value.is_primary,
            size: value.size,
            file_name: value.file_name,
            uploaded_time: value.uploaded_time,
            mod_version: value.mod_version,
            external_virus_scan_url: value.external_virus_scan_url,
            description: value.description,
            size_kb: value.size_kb,
            size_in_bytes: value.size_in_bytes.map(|s| s.to_string()),
            changelog_html: value.changelog_html,
            content_preview_link: value.content_preview_link,
        }
    }
}

impl From<api::ModFiles> for ModFiles {
    fn from(value: api::ModFiles) -> Self {
        Self {
            file_updates: value.file_updates.into_iter().map(|x| x.into()).collect(),
            files: value.files.into_iter().map(|x| x.into()).collect(),
        }
    }
}

impl From<api::DownloadLink> for DownloadLink {
    fn from(value: api::DownloadLink) -> Self {
        Self {
            name: value.name,
            short_name: value.short_name,
            uri: value.uri,
        }
    }
}

impl FromStr for FileCategory {
    fn from_str(name: &str) -> Result<Self, Self::Err> {
        match name.to_uppercase().as_str() {
            "MAIN" => Ok(FileCategory::Main),                   // category_id 1
            "UPDATE" => Ok(FileCategory::Update),               // ?
            "OPTIONAL" => Ok(FileCategory::Optional),           // category_id 3
            "OLD_VERSION" => Ok(FileCategory::OldVersion),      // category_id 4
            "MISCELLANEOUS" => Ok(FileCategory::Miscellaneous), // ?
            "ARCHIVED" => Ok(FileCategory::Archived),           // category_id 7
            _ => Err(anyhow::anyhow!(
                "Couldn't determine file category from string: {name:?}"
            )), // category_id 6 ?
        }
    }

    type Err = anyhow::Error;
}
