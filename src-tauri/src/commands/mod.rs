pub mod archive2;
pub mod download;
pub mod errors;
pub mod game;
pub mod ini;
pub mod mods;
pub mod nexusmods;
pub mod nxm;
pub mod open;
pub mod paths;
pub mod profiles;
pub mod resourcelists;
pub mod screenshots;
pub mod settings;
pub mod translations;

#[tauri::command]
#[specta::specta]
pub fn is_debug() -> bool {
    crate::info::is_debug()
}

#[tauri::command]
#[specta::specta]
pub fn is_prerelease() -> bool {
    crate::info::is_prerelease()
}
