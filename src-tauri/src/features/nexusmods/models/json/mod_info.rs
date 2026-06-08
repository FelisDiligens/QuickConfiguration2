//! New JSON formats for NexusMods mod info.

use anyhow::anyhow;
use serde::{Deserialize, Serialize};
use specta::Type;

use crate::features::nexusmods::models::api;
use crate::features::nexusmods::models::xml;

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
#[serde(rename_all = "camelCase")]
#[specta(rename = "NexusModsModInfos")]
pub struct ModInfos {
    pub mods: Vec<ModInfo>,
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
    pub name: String,
    // A short summary about the mod
    pub summary: String,
    // The mod's latest version
    pub version: String,
    pub author: String,
    pub uploaded_by: String,
    // The mod's "preview" or thumbnail image
    pub picture_url: String,
    /// A thumbnail downloaded from `picture_url`
    pub thumbnail_filename: Option<String>,
    pub endorsement_count: u32,
    pub endorse_status: EndorseStatus,
    pub contains_adult_content: bool,
    #[specta(type = String)] // will be formatted as RFC3339
    pub created_time: chrono::DateTime<chrono::Utc>,
    #[specta(type = String)] // will be formatted as RFC3339
    pub updated_time: chrono::DateTime<chrono::Utc>,
    #[specta(type = String)] // will be formatted as RFC3339
    pub last_access_time: chrono::DateTime<chrono::Utc>,
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
        })
    }
}

impl TryFrom<xml::Mod> for ModInfo {
    type Error = anyhow::Error;

    fn try_from(value: xml::Mod) -> Result<Self, Self::Error> {
        Ok(Self {
            game_scoped_id: value.id,
            game_domain: value.game.unwrap_or("fallout76".to_string()),
            name: value.title,
            summary: value.summary,
            version: value.latest_version,
            author: value.author,
            uploaded_by: value.uploader,
            picture_url: value.thumbnail.clone().map(|t| t.url).unwrap_or_default(),
            thumbnail_filename: value.thumbnail.map(|t| t.file),
            endorsement_count: value.endorsement_count,
            endorse_status: value.endorse_state.into(),
            contains_adult_content: value.contains_adult_content.unwrap_or(false),
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
