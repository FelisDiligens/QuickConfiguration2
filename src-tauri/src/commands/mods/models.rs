use serde::{Deserialize, Serialize};
use specta::Type;

use crate::features::mods::models::json::{ManagedMod, ManagedMods, ModInstallationState};

/// Partial mods store update returned by some commands.
#[derive(Serialize, Deserialize, Debug, Clone, Type)]
#[serde(rename_all = "kebab-case", tag = "type", content = "message")]
pub enum ModsStateUpdate {
    UpdatedAll(ManagedMods),
    UpdatedEnabled(bool),
    UpdatedMods(Vec<ManagedMod>),
    UpdatedState(Vec<ModInstallationState>),
    UpdatedMod(ManagedMod),
    AppendedMod(ManagedMod),
    DeletedMod(String),
}
