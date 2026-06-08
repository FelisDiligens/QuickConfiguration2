use serde::{Deserialize, Serialize};
use specta::Type;
use tauri_specta::Event;

#[derive(Serialize, Deserialize, Debug, Clone, Type, Event)]
#[serde(rename_all = "kebab-case", tag = "status")]
pub enum ModsMigrationProgress {
    RemovingBundledArchives,
    #[serde(rename_all = "camelCase")]
    RemovingMod {
        mod_title: String,
        current_mod: u32,
        total_mods: u32,
    },
    #[serde(rename_all = "camelCase")]
    MigratingMod {
        mod_title: String,
        current_mod: u32,
        total_mods: u32,
    },
    Cleanup,
}
pub const MODS_MIGRATION_PROGRESS_EVENT: &str = "mods-migration-progress";
