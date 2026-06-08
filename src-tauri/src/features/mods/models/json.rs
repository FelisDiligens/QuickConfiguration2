//! New JSON format (from v2) to save the state of managed mods.

use serde::{Deserialize, Serialize};
use specta::Type;
use uuid::Uuid;

use super::xml;

/// State of managed mods for the game.
#[derive(Serialize, Deserialize, Debug, Clone, Type)]
#[serde(rename_all = "camelCase", default)]
pub struct ManagedMods {
    /// Toggle to enable/disable mods globally.
    pub enabled: bool,
    /// Installed mods and how it should be deployed to disk (if enabled).
    pub mods: Vec<ManagedMod>,
    /// Current disk state: How mods are currently deployed to disk.
    pub state: Vec<ModInstallationState>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub migrated_from_v1: Option<Migration>,
}

/// Represents a managed mod. Stores information about the mod and how it should be installed.
#[derive(Serialize, Deserialize, Debug, Clone, Type)]
#[serde(rename_all = "camelCase")]
pub struct ManagedMod {
    /// A uuidv4 key identifying a mod
    pub key: String,
    pub title: String,
    /// The folder name of the mod inside of the mods path.
    pub folder_name: String,
    /// The installed version
    pub version: String,
    /// The source URL, e.g. from NexusMods
    pub url: String,
    /// The user's notes about the mod.
    pub notes: String,
    /// Enabled for deployment: Whether we want to have this mod deployed or not.
    pub enabled: bool,
    /// Deployment options: How we want the mod to be deployed.
    pub options: ModInstallationOptions,
}

#[derive(Serialize, Deserialize, Debug, Clone, Type)]
#[serde(rename_all = "camelCase")]
pub struct ModInstallationOptions {
    /// The folder where to copy files to on deployment.
    pub root_folder: String,
}

#[derive(Serialize, Deserialize, Debug, Clone, Type)]
#[serde(rename_all = "camelCase")]
pub struct ModArchive {
    /// Name of the BA2 archive
    pub name: String,
    /// Whether to add or remove from resource list.
    pub enabled: bool,
}

/// Represents a mod that was deployed to the game folder. Stores information about how the mod was installed.
#[derive(Serialize, Deserialize, Debug, Clone, Type)]
#[serde(rename_all = "camelCase")]
pub struct ModInstallationState {
    /// A uuidv4 key identifying a mod
    pub key: String,
    /// The folder where files have previously been copied to.
    pub root_folder: String,
    /// Relative paths of the mod files that have previously been copied.
    pub files: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Clone, Type)]
#[serde(rename_all = "camelCase")]
#[specta(rename = "ModsMigration")]
pub struct Migration {
    #[specta(type = String)] // will be formatted as RFC3339
    pub date: chrono::DateTime<chrono::Utc>,
}

impl ManagedMods {
    pub fn get_mod<S: AsRef<str>>(&self, key: S) -> Option<&ManagedMod> {
        let key = key.as_ref();
        self.mods.iter().find(|r#mod| r#mod.key == key)
    }

    pub fn get_mod_state<S: AsRef<str>>(&self, key: S) -> Option<&ModInstallationState> {
        let key = key.as_ref();
        self.state.iter().find(|state| state.key == key)
    }

    /// Removes mod with key from the list. This does not delete the folder.
    pub fn remove_mod<S: AsRef<str>>(&mut self, key: S) -> Option<ManagedMod> {
        self.mods
            .iter()
            .position(|r#mod| r#mod.key == key.as_ref())
            .map(|index| self.mods.remove(index))
    }
}

impl Default for ManagedMods {
    fn default() -> Self {
        Self {
            enabled: true,
            mods: Vec::new(),
            state: Vec::new(),
            migrated_from_v1: None,
        }
    }
}

impl Default for ManagedMod {
    fn default() -> Self {
        Self {
            key: Uuid::new_v4().to_string(),
            title: String::new(),
            folder_name: String::new(),
            version: String::new(),
            url: String::new(),
            notes: String::new(),
            enabled: false,
            options: ModInstallationOptions::default(),
        }
    }
}

impl Default for ModInstallationOptions {
    fn default() -> Self {
        Self {
            root_folder: ".".to_string(),
        }
    }
}

impl From<xml::ManagedMods> for ManagedMods {
    fn from(value: xml::ManagedMods) -> Self {
        Self {
            enabled: value.enabled,
            mods: value
                .mods
                .clone()
                .into_iter()
                .map(|r#mod| r#mod.into())
                .collect(),
            state: value
                .mods
                .into_iter()
                .filter_map(Option::<ModInstallationState>::from)
                .collect(),
            migrated_from_v1: None,
        }
    }
}

impl From<xml::ManagedMod> for ManagedMod {
    fn from(value: xml::ManagedMod) -> Self {
        Self {
            key: value.guid,
            title: value.title,
            folder_name: value.folder,
            version: value.version,
            url: value.nexusmods.url,
            notes: value.notes,
            enabled: value.state.pending.enabled,
            options: ModInstallationOptions {
                root_folder: value.state.pending.root_folder,
            },
        }
    }
}

impl From<xml::ManagedMod> for Option<ModInstallationState> {
    fn from(value: xml::ManagedMod) -> Self {
        if value.state.current.deployed {
            Some(ModInstallationState {
                key: value.guid,
                root_folder: value.state.current.root_folder,
                files: value
                    .state
                    .current
                    .installed_loose_files
                    .files
                    .unwrap_or_default()
                    .into_iter()
                    .map(|file| file.path)
                    .collect(),
            })
        } else {
            None
        }
    }
}
