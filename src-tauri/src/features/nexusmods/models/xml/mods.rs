//! Legacy XML format (from v1) to save NexusMods mod info.

use serde::{Deserialize, Serialize};

use crate::features::nexusmods::models::json;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "PascalCase")]
pub struct Mods {
    #[serde(rename = "Mod")]
    pub mods: Vec<Mod>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "PascalCase")]
pub struct Mod {
    #[serde(rename = "@id")]
    pub id: u32,
    #[serde(rename = "@game")]
    pub game: Option<String>,
    #[serde(rename = "@nsfw")]
    pub contains_adult_content: Option<bool>,
    pub title: String,
    #[serde(rename = "Version")]
    pub latest_version: String,
    #[serde(rename = "CreatedBy")]
    pub author: String,
    #[serde(rename = "UploadedBy")]
    pub uploader: String,
    pub summary: String,
    pub endorsement_count: u32,
    pub created_timestamp: i64,
    pub updated_timestamp: i64,
    pub thumbnail: Option<Thumbnail>,
    pub endorse_state: EndorseState,
    #[serde(rename = "LastUpdated")]
    pub last_access_timestamp: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "PascalCase")]
pub struct Thumbnail {
    #[serde(rename = "URL")]
    pub url: String,
    #[serde(rename = "File")]
    pub file: String,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Clone)]
pub enum EndorseState {
    Endorsed,
    Abstained,
    Undecided,
}

impl From<json::ModInfos> for Mods {
    fn from(value: json::ModInfos) -> Self {
        Self {
            mods: value.mods.into_iter().map(|r#mod| r#mod.into()).collect(),
        }
    }
}

impl From<json::ModInfo> for Mod {
    fn from(value: json::ModInfo) -> Self {
        Self {
            id: value.game_scoped_id,
            game: Some(value.game_domain),
            contains_adult_content: Some(value.contains_adult_content),
            title: value.name,
            latest_version: value.version,
            author: value.author,
            uploader: value.uploaded_by,
            summary: value.summary,
            endorsement_count: value.endorsement_count,
            created_timestamp: value.created_time.timestamp(),
            updated_timestamp: value.updated_time.timestamp(),
            thumbnail: if let Some(thumbnail_filename) = value.thumbnail_filename {
                Some(Thumbnail {
                    url: value.picture_url,
                    file: thumbnail_filename,
                })
            } else {
                None
            },
            endorse_state: value.endorse_status.into(),
            last_access_timestamp: value.last_access_time.timestamp(),
        }
    }
}

impl From<json::EndorseStatus> for EndorseState {
    fn from(value: json::EndorseStatus) -> Self {
        match value {
            json::EndorseStatus::Endorsed => EndorseState::Endorsed,
            json::EndorseStatus::Abstained => EndorseState::Abstained,
            json::EndorseStatus::Undecided => EndorseState::Undecided,
        }
    }
}
