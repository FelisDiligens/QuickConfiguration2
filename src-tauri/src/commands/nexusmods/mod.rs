mod api;
mod data;
mod sso;

pub use api::*;
pub use data::*;
pub use sso::*;

use serde::{Deserialize, Serialize};
use specta::Type;

use crate::{
    commands::errors::CommandResult,
    features::nexusmods::{self, models::api::ModID},
};

#[derive(Debug, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct NXMLinkDetails {
    pub game_domain: String,
    pub game_scoped_id: u32,
    pub file_id: u32,
    pub key: String,
    pub expires: u32,
    pub user_id: u32,
}

impl TryFrom<nexusmods::nxm::NXMLinkDetails> for NXMLinkDetails {
    type Error = anyhow::Error;

    fn try_from(value: nexusmods::nxm::NXMLinkDetails) -> Result<Self, Self::Error> {
        Ok(Self {
            game_domain: value.game_domain,
            game_scoped_id: value.game_scoped_id.try_into()?,
            file_id: value.file_id.try_into()?,
            key: value.key,
            expires: value.expires.try_into()?,
            user_id: value.user_id.try_into()?,
        })
    }
}

#[tauri::command]
#[specta::specta]
pub async fn nexusmods_extract_ids_from_url(url: String) -> CommandResult<(String, u32)> {
    Ok(ModID::URL(url).into_ids()?)
}

#[tauri::command]
#[specta::specta]
pub fn nexusmods_extract_details_from_nxm_url(nxm_link: String) -> CommandResult<NXMLinkDetails> {
    Ok(nexusmods::nxm::parse_nxm_link(nxm_link)?.try_into()?)
}
