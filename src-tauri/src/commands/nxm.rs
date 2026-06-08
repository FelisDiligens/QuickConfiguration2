use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::State;
use tauri_specta::Event;

use crate::commands::errors::CommandResult;
use crate::features::args::Arguments;
use crate::features::linkhandler;

#[derive(Serialize, Deserialize, Debug, Clone, Type, Event)]
#[serde(rename_all = "camelCase")]
pub struct NXMNewLink(pub String);
pub const NXM_NEW_LINK_EVENT: &str = "nxm-new-link";

pub const NXM_PROTOCOL: &str = "nxm";

pub fn get_url_from_args<S: AsRef<str>, I: Iterator<Item = S>>(mut args: I) -> Option<url::Url> {
    args.next(); // bin name
    let arg = args.next();
    if let Some(url) = arg.and_then(|arg| arg.as_ref().parse::<url::Url>().ok())
        && url.scheme() == NXM_PROTOCOL
    {
        Some(url)
    } else {
        None
    }
}

#[tauri::command]
#[specta::specta]
pub fn nxm_get_current(args: State<'_, Arguments>) -> Option<String> {
    get_url_from_args(args.0.iter()).map(|url| url.to_string())
}

#[tauri::command]
#[specta::specta]
pub fn nxm_register() -> CommandResult<()> {
    Ok(linkhandler::register(NXM_PROTOCOL)?)
}

#[tauri::command]
#[specta::specta]
pub fn nxm_unregister() -> CommandResult<()> {
    Ok(linkhandler::unregister(NXM_PROTOCOL)?)
}

#[tauri::command]
#[specta::specta]
pub fn nxm_is_registered() -> CommandResult<bool> {
    Ok(linkhandler::is_registered(NXM_PROTOCOL)?)
}
