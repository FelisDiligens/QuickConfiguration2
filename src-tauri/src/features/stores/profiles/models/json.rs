use camino::Utf8PathBuf;
use serde::{Deserialize, Serialize};
use specta::Type;

use crate::features::game::paths::game_config;

use super::enums::{GameEdition, LaunchOption};
use super::xml;

#[derive(Default, Debug, Serialize, Deserialize, PartialEq, Clone, Type)]
pub struct Profiles {
    pub selected: String,
    pub profiles: Vec<Profile>,
}

impl From<xml::Profiles> for Profiles {
    fn from(value: xml::Profiles) -> Self {
        let profiles: Vec<Profile> = value.profiles.iter().map(|p| p.clone().into()).collect();
        Self {
            selected: profiles
                .iter()
                .enumerate()
                .find(|(index, _)| *index as u32 == value.selected)
                .map(|(_, profile)| profile.key.clone())
                .unwrap_or_default(),
            profiles,
        }
    }
}

impl Profiles {
    pub fn new() -> Self {
        Self::default()
    }
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Clone, Type)]
#[serde(rename_all = "camelCase")]
pub struct Profile {
    pub key: String,
    pub title: String,
    pub installation_path: String,
    pub mods_path: String,
    pub executable_name: String,
    pub exec_parameters: String,
    #[serde(rename = "launcherURL")]
    pub launcher_url: String,
    pub ini_prefix: String,
    pub ini_path: String,
    pub game_edition: GameEdition,
    pub launch_option: LaunchOption,
}

impl From<xml::Profile> for Profile {
    fn from(value: xml::Profile) -> Self {
        // In v1, the mods path would get extended with a "Mods" folder. In v2, that isn't the case anymore:
        let mods_path = match value.mods_path {
            Some(mods_path) => Utf8PathBuf::from(mods_path).join("Mods").to_string(),
            None => Utf8PathBuf::from(&value.installation_path)
                .join("Mods")
                .to_string(),
        };
        let ini_path = match value.ini_path {
            Some(ini_path) => ini_path,
            None => game_config::detect_ini_path(Some(&value.installation_path))
                .unwrap_or_default()
                .to_string_lossy()
                .to_string(),
        };
        let game_edition = match value.game_edition {
            GameEdition::Steam => GameEdition::Steam,
            GameEdition::SteamPTS => GameEdition::SteamPTS,
            GameEdition::Xbox => GameEdition::Xbox,
            // MSStore and Xbox are basically equivalent:
            GameEdition::MSStore => GameEdition::Xbox,
            // When Bethesda.net shut down, customers were migrated to Steam:
            GameEdition::BethesdaNet => GameEdition::Steam,
            GameEdition::BethesdaNetPTS => GameEdition::SteamPTS,
            GameEdition::Unknown => GameEdition::Unknown,
        };
        Self {
            key: uuid::Uuid::new_v4().to_string(),
            title: value.title,
            installation_path: value.installation_path,
            mods_path,
            executable_name: value.executable_name,
            exec_parameters: value.exec_parameters,
            launcher_url: value.launcher_url,
            ini_prefix: value.ini_prefix,
            ini_path,
            game_edition,
            launch_option: value.launch_option,
        }
    }
}
