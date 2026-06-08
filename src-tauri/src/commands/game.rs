use crate::commands::errors::CommandResult;
use crate::features::{game, stores::profiles::models::json::Profile};

#[tauri::command]
#[specta::specta]
#[function_name::named]
pub fn launch_game(profile: Profile) -> CommandResult<()> {
    log::trace!("Called command {}", function_name!());
    Ok(game::launch::launch_game(profile)?)
}
