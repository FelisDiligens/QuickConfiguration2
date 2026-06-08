use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::{
    AppHandle, Emitter, Listener,
    async_runtime::{self, spawn},
};
use tauri_specta::Event;

use crate::commands::errors::CommandResult;
use crate::features::nexusmods;
use crate::features::nexusmods::sso::SSOLoginResult;

#[derive(Serialize, Deserialize, Debug, Clone, Type, Event)]
#[serde(rename_all = "camelCase")]
#[specta(rename = "NexusModsSSOUpdate")]
pub enum SSOUpdate {
    ApiKey(String),
    Error(String),
    Canceled,
}
const SSO_UPDATE_EVENT: &str = "sso-update";

#[derive(Serialize, Deserialize, Debug, Clone, Type, Event)]
#[serde(rename_all = "camelCase")]
#[specta(rename = "NexusModsSSOAbort")]
pub struct SSOAbort;
const SSO_ABORT_EVENT: &str = "sso-abort";

#[tauri::command]
#[specta::specta]
pub fn nexusmods_login_via_sso(app: AppHandle) -> CommandResult<()> {
    log::trace!("NexusMods Login – logging in via SSO");

    // Cancellation signal:
    let (cancel_tx, cancel_rx) = async_runtime::channel::<bool>(size_of::<bool>());

    // When receiving an "sso-abort" event, send via cancellation signal:
    let abort_event_listener = app.once(SSO_ABORT_EVENT, move |_| {
        spawn(async move {
            cancel_tx.send(true).await.unwrap();
        });
    });

    // Do SSO login in the background and communicate updates via "sso-update" events to the frontend:
    spawn(async move {
        match nexusmods::sso::sso_login(None, cancel_rx).await {
            Ok(SSOLoginResult::ApiKey(api_key)) => {
                log::trace!("NexusMods Login – API Key received");
                app.emit(SSO_UPDATE_EVENT, SSOUpdate::ApiKey(api_key))
                    .unwrap()
            }
            Ok(SSOLoginResult::Canceled) => {
                log::trace!("NexusMods Login – canceled");
                app.emit(SSO_UPDATE_EVENT, SSOUpdate::Canceled).unwrap()
            }
            Err(err) => {
                log::error!("NexusMods Login – failed: {err}");
                app.emit(SSO_UPDATE_EVENT, SSOUpdate::Error(err.to_string()))
                    .unwrap()
            }
        };

        // Cleaning up event listener:
        app.unlisten(abort_event_listener);
    });

    Ok(())
}
