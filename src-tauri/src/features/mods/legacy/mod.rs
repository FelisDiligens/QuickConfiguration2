#[cfg(test)]
pub mod tests;

mod migrate;
mod models;

pub use migrate::*;
pub use models::*;

use std::path::Path;

use serde::{Deserialize, Serialize};
use specta::Type;

use crate::features::mods::{
    get_legacy_mods_metadata_path, get_legacy_pre_v1_9_mods_metadata_path, get_mods_metadata_path,
    load_mods,
};

#[derive(Debug, Serialize, Deserialize, PartialEq, Clone, Type)]
#[serde(rename_all = "kebab-case")]
#[specta(rename = "ModsMigrationState")]
pub enum MigrationState {
    /// manifest.xml (from before v1.9.0) without managed.xml found, no migrations yet
    #[serde(rename = "pre-v1.9-found")]
    PreV1_9Found,
    /// managed.xml (from v1.9.0 or later) found, no migrations yet
    #[serde(rename = "v1.9-or-later-found")]
    V1_9OrLaterFound,
    /// managed.xml (from v1.9.0 or later) found, already migrated
    #[serde(rename = "v1.9-migrated")]
    V1_9Migrated,
    /// No legacy metadata found, migration not necessary
    None,
}

pub fn detect_migration_state<P: AsRef<Path>>(mods_path: P) -> MigrationState {
    let mods_path = mods_path.as_ref();

    let legacy_manifest_path = get_legacy_pre_v1_9_mods_metadata_path(mods_path);
    let legacy_managed_path = get_legacy_mods_metadata_path(mods_path);
    let new_metadata_path = get_mods_metadata_path(mods_path);

    let legacy_manifest_exists = legacy_manifest_path.exists();
    let legacy_managed_exists = legacy_managed_path.exists();
    let new_metadata_exists = new_metadata_path.exists();

    let new_metadata = load_mods(mods_path).ok().flatten();
    let migrated_from_v1 = new_metadata.and_then(|m| m.migrated_from_v1);

    if legacy_manifest_exists && !legacy_managed_exists && !new_metadata_exists {
        return MigrationState::PreV1_9Found;
    } else if legacy_managed_exists && (!new_metadata_exists || migrated_from_v1.is_none()) {
        return MigrationState::V1_9OrLaterFound;
    } else if legacy_managed_exists && new_metadata_exists && migrated_from_v1.is_some() {
        return MigrationState::V1_9Migrated;
    }

    MigrationState::None
}
