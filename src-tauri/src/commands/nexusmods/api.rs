use tap::TapFallible;

use crate::commands::errors::{CommandError, CommandResult};
use crate::features::nexusmods;
use crate::features::nexusmods::{api::NexusModsAPI, models::api, models::json};

#[tauri::command]
#[specta::specta]
pub async fn nexusmods_api_validate(api_key: String) -> CommandResult<json::AccountInfo> {
    NexusModsAPI::new(api_key)
        .validate()
        .await
        .tap_err(|err| log::error!("Failed to validate API key: {err}"))
        .map_err(CommandError::from)
}

#[tauri::command]
#[specta::specta]
pub async fn nexusmods_api_retrieve_modinfo(
    api_key: String,
    game_domain: String,
    game_scoped_id: u32,
) -> CommandResult<json::ModInfo> {
    NexusModsAPI::new(api_key)
        .retrieve_modinfo(api::ModID::IDs(game_domain, game_scoped_id))
        .await
        .tap_err(|err| log::error!("Failed to call API: {err}"))
        .map_err(CommandError::from)
}

#[tauri::command]
#[specta::specta]
pub async fn nexusmods_api_endorse(
    api_key: String,
    game_domain: String,
    game_scoped_id: u32,
    mod_version: String,
) -> CommandResult<()> {
    NexusModsAPI::new(api_key)
        .endorse(api::ModID::IDs(game_domain, game_scoped_id), mod_version)
        .await
        .tap_err(|err| log::error!("Failed to call API: {err}"))
        .map_err(CommandError::from)
}

#[tauri::command]
#[specta::specta]
pub async fn nexusmods_api_abstain(
    api_key: String,
    game_domain: String,
    game_scoped_id: u32,
    mod_version: String,
) -> CommandResult<()> {
    NexusModsAPI::new(api_key)
        .abstain(api::ModID::IDs(game_domain, game_scoped_id), mod_version)
        .await
        .tap_err(|err| log::error!("Failed to call API: {err}"))
        .map_err(CommandError::from)
}

#[tauri::command]
#[specta::specta]
pub async fn nexusmods_api_list_mod_files(
    api_key: String,
    game_domain: String,
    game_scoped_id: u32,
    category: api::FileCategory,
) -> CommandResult<json::ModFiles> {
    NexusModsAPI::new(api_key)
        .list_mod_files(api::ModID::IDs(game_domain, game_scoped_id), Some(category))
        .await
        .tap_err(|err| log::error!("Failed to call API: {err}"))
        .map_err(CommandError::from)
}

#[tauri::command]
#[specta::specta]
pub async fn nexusmods_api_request_download_links(
    api_key: String,
    nxm_link: String,
) -> CommandResult<Vec<json::DownloadLink>> {
    // Extract the details from the nxm:// link:
    let nxm_details = nexusmods::nxm::parse_nxm_link(&nxm_link)
        .tap_err(|err| log::error!("Failed to parse nxm link: {err}"))?;

    // Request all CDN download links from the NexusMods API:
    log::trace!("Requesting download links from NexusMods API with: {nxm_details:?}");
    NexusModsAPI::new(api_key)
        .request_download_links(
            nxm_details.game_domain,
            nxm_details.game_scoped_id,
            nxm_details.file_id,
            Some(nxm_details.key),
            Some(nxm_details.expires),
        )
        .await
        .tap_err(|err| log::error!("Failed to call API: {err}"))
        .map_err(CommandError::from)
}
