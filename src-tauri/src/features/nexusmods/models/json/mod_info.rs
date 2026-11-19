//! New JSON formats for NexusMods mod info.

use anyhow::anyhow;
use serde::{Deserialize, Serialize};
use specta::Type;

use crate::features::nexusmods::models::json::FileCategory;
use crate::features::nexusmods::models::xml;
use crate::features::nexusmods::models::{api, json};
use crate::features::nexusmods::utils::get_latest_file;

#[derive(Debug, Default, Serialize, Deserialize, Clone, Type)]
#[serde(rename_all = "camelCase", default)]
#[specta(rename = "NexusModsModInfos")]
pub struct ModInfos {
    pub mods: Vec<ModInfo>,
    pub files: Vec<ModFileInfo>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
#[serde(rename_all = "camelCase")]
#[specta(rename = "NexusModsModInfo")]
pub struct ModInfo {
    /// The mod's ID, e.g. 546
    pub game_scoped_id: u32,
    /// The game for which the mod was uploaded, e.g. "fallout76"
    pub game_domain: String,
    // The mod's name or title
    pub name: Option<String>,
    // A short summary about the mod
    pub summary: Option<String>,
    // The mod's latest version
    pub version: String,
    pub author: String,
    pub uploaded_by: String,
    // The mod's "preview" or thumbnail image
    pub picture_url: Option<String>,
    /// A thumbnail downloaded from `picture_url`
    pub thumbnail_filename: Option<String>,
    pub endorsement_count: u32,
    pub endorse_status: EndorseStatus,
    pub contains_adult_content: bool,
    pub available: bool,
    #[specta(type = String)] // will be formatted as RFC3339
    pub created_time: chrono::DateTime<chrono::Utc>,
    #[specta(type = String)] // will be formatted as RFC3339
    pub updated_time: chrono::DateTime<chrono::Utc>,
    #[specta(type = String)] // will be formatted as RFC3339
    pub last_access_time: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
#[serde(rename_all = "camelCase")]
#[specta(rename = "NexusModsModFileInfo")]
pub struct ModFileInfo {
    /// The mod's ID, e.g. 546
    pub game_scoped_id: u32,
    /// The game for which the mod was uploaded, e.g. "fallout76"
    pub game_domain: String,
    /// The file ID, e.g. 17669
    pub file_id: u32,
    /// The title of the file (not the file name)
    pub name: String,
    /// The file's version
    pub version: String,
    /// The file's category
    pub category: Option<FileCategory>,
    /// If found through file updates, the latest version of this file
    #[serde(skip_serializing_if = "Option::is_none")]
    pub latest_file: Option<LatestModFileInfo>,
}

// Duplicated, because recursive structs cause stack overflow when exporting bindings:
#[derive(Debug, Serialize, Deserialize, Clone, Type)]
#[serde(rename_all = "camelCase")]
#[specta(rename = "NexusModsLatestModFileInfo")]
pub struct LatestModFileInfo {
    /// The mod's ID, e.g. 546
    pub game_scoped_id: u32,
    /// The game for which the mod was uploaded, e.g. "fallout76"
    pub game_domain: String,
    /// The file ID, e.g. 17669
    pub file_id: u32,
    /// The title of the file (not the file name)
    pub name: String,
    /// The file's version
    pub version: String,
    /// The file's category
    pub category: Option<FileCategory>,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Clone, Type)]
#[specta(rename = "NexusModsEndorseStatus")]
pub enum EndorseStatus {
    Endorsed,
    Abstained,
    Undecided,
}

impl From<api::ModInfo> for ModInfo {
    fn from(value: api::ModInfo) -> Self {
        Self {
            game_scoped_id: value.mod_id,
            game_domain: value.domain_name,
            name: value.name,
            summary: value.summary,
            version: value.version,
            author: value.author,
            uploaded_by: value.uploaded_by,
            picture_url: value.picture_url,
            thumbnail_filename: None,
            endorsement_count: value.endorsement_count,
            endorse_status: value.endorsement.endorse_status.into(),
            contains_adult_content: value.contains_adult_content,
            available: value.available,
            created_time: value.created_time,
            updated_time: value.updated_time,
            last_access_time: chrono::Utc::now(),
        }
    }
}

impl TryFrom<xml::Mods> for ModInfos {
    type Error = anyhow::Error;

    fn try_from(value: xml::Mods) -> Result<Self, Self::Error> {
        Ok(Self {
            mods: value
                .mods
                .into_iter()
                .map(|r#mod| r#mod.try_into())
                .collect::<Result<_, _>>()?,
            ..Default::default()
        })
    }
}

impl TryFrom<xml::Mod> for ModInfo {
    type Error = anyhow::Error;

    fn try_from(value: xml::Mod) -> Result<Self, Self::Error> {
        Ok(Self {
            game_scoped_id: value.id,
            game_domain: value.game.unwrap_or("fallout76".to_string()),
            name: Some(value.title),
            summary: Some(value.summary),
            version: value.latest_version,
            author: value.author,
            uploaded_by: value.uploader,
            picture_url: Some(value.thumbnail.clone().map(|t| t.url).unwrap_or_default()),
            thumbnail_filename: value.thumbnail.map(|t| t.file),
            endorsement_count: value.endorsement_count,
            endorse_status: value.endorse_state.into(),
            contains_adult_content: value.contains_adult_content.unwrap_or(false),
            available: true,
            created_time: chrono::DateTime::<chrono::Utc>::from_timestamp(
                value.created_timestamp,
                0,
            )
            .ok_or(anyhow!(
                "Couldn't convert Unix timestamp to datetime: {}",
                value.created_timestamp
            ))?,
            updated_time: chrono::DateTime::<chrono::Utc>::from_timestamp(
                value.updated_timestamp,
                0,
            )
            .ok_or(anyhow!(
                "Couldn't convert Unix timestamp to datetime: {}",
                value.updated_timestamp
            ))?,
            last_access_time: chrono::DateTime::<chrono::Utc>::from_timestamp(
                value.last_access_timestamp,
                0,
            )
            .ok_or(anyhow!(
                "Couldn't convert Unix timestamp to datetime: {}",
                value.last_access_timestamp
            ))?,
        })
    }
}

impl ModFileInfo {
    pub fn from_api_response(
        game_domain: String,
        game_scoped_id: u32,
        file_id: u32,
        resp: &json::ModFiles,
    ) -> Option<ModFileInfo> {
        let current_file = resp.files.iter().find(|file| file.file_id == file_id)?;
        let latest_file = get_latest_file(file_id, resp);
        Some(ModFileInfo {
            game_scoped_id,
            game_domain: game_domain.clone(),
            file_id: current_file.file_id,
            name: current_file.name.clone(),
            version: current_file.version.clone(),
            category: current_file.category.clone(),
            latest_file: latest_file.map(|f| LatestModFileInfo {
                game_scoped_id,
                game_domain,
                file_id: f.file_id,
                name: f.name.clone(),
                version: f.version.clone(),
                category: f.category.clone(),
            }),
        })
    }
}

impl From<xml::EndorseState> for EndorseStatus {
    fn from(value: xml::EndorseState) -> Self {
        match value {
            xml::EndorseState::Endorsed => EndorseStatus::Endorsed,
            xml::EndorseState::Abstained => EndorseStatus::Abstained,
            xml::EndorseState::Undecided => EndorseStatus::Undecided,
        }
    }
}

impl From<api::EndorseStatus> for EndorseStatus {
    fn from(value: api::EndorseStatus) -> Self {
        match value {
            api::EndorseStatus::Endorsed => EndorseStatus::Endorsed,
            api::EndorseStatus::Abstained => EndorseStatus::Abstained,
            api::EndorseStatus::Undecided => EndorseStatus::Undecided,
        }
    }
}
