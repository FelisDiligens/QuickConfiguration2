use tap::TapFallible;
use tauri::async_runtime::spawn_blocking;

use crate::commands::errors::{CommandError, CommandResult};
use crate::features::nexusmods;
use crate::features::nexusmods::models::json::{AccountInfo, ModInfos};

#[tauri::command]
#[specta::specta]
#[function_name::named]
pub async fn nexusmods_get_account_info() -> CommandResult<Option<AccountInfo>> {
    log::trace!("Called command {}", function_name!());
    spawn_blocking(|| {
        nexusmods::get_account()
            .tap_err(|err| log::error!("Failed to read account XML file: {err}"))
            .map_err(CommandError::from)
    })
    .await
    .tap_err(|e| log::error!("Couldn't join handle in {}: {}", function_name!(), e))
    .map_err(CommandError::from)
    .flatten()
}

#[tauri::command]
#[specta::specta]
#[function_name::named]
pub async fn nexusmods_set_account_info(account_info: AccountInfo) -> CommandResult<()> {
    log::trace!("Called command {}", function_name!());
    spawn_blocking(|| {
        nexusmods::set_account(account_info)
            .tap_err(|err| log::error!("Failed to save account XML file: {err}"))
            .map_err(CommandError::from)
    })
    .await
    .tap_err(|e| log::error!("Couldn't join handle in {}: {}", function_name!(), e))
    .map_err(CommandError::from)
    .flatten()
}

#[tauri::command]
#[specta::specta]
#[function_name::named]
pub async fn nexusmods_delete_account_info() -> CommandResult<()> {
    log::trace!("Called command {}", function_name!());
    spawn_blocking(|| {
        nexusmods::delete_legacy_account()
            .tap_err(|err| log::error!("Failed to delete account XML file: {err}"))
            .map_err(CommandError::from)
    })
    .await
    .tap_err(|e| log::error!("Couldn't join handle in {}: {}", function_name!(), e))
    .map_err(CommandError::from)
    .flatten()
}

#[tauri::command]
#[specta::specta]
#[function_name::named]
pub async fn nexusmods_get_modinfos() -> CommandResult<Option<ModInfos>> {
    log::trace!("Called command {}", function_name!());
    spawn_blocking(|| {
        nexusmods::get_modinfos()
            .tap_err(|err| log::error!("Failed to read mod info XML file: {err}"))
            .map_err(CommandError::from)
    })
    .await
    .tap_err(|e| log::error!("Couldn't join handle in {}: {}", function_name!(), e))
    .map_err(CommandError::from)
    .flatten()
}

#[tauri::command]
#[specta::specta]
#[function_name::named]
pub async fn nexusmods_set_modinfos(modinfos: ModInfos) -> CommandResult<()> {
    log::trace!("Called command {}", function_name!());
    spawn_blocking(|| {
        nexusmods::set_modinfos(modinfos)
            .tap_err(|err| log::error!("Failed to save mod info XML file: {err}"))
            .map_err(CommandError::from)
    })
    .await
    .tap_err(|e| log::error!("Couldn't join handle in {}: {}", function_name!(), e))
    .map_err(CommandError::from)
    .flatten()
}
