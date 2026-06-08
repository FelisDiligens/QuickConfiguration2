//! Legacy XML format (from v1) to save game profiles.

use camino::Utf8PathBuf;
use serde::{Deserialize, Serialize};

use super::{
    enums::{GameEdition, LaunchOption},
    json,
};

#[derive(Debug, Serialize, Deserialize, PartialEq, Clone)]
#[serde(rename = "Games")]
pub struct Profiles {
    #[serde(rename = "@selected")]
    pub selected: u32,
    #[serde(rename = "Game")]
    pub profiles: Vec<Profile>,
}

impl From<json::Profiles> for Profiles {
    fn from(value: json::Profiles) -> Self {
        Self {
            selected: value
                .profiles
                .iter()
                .enumerate()
                .find(|(_, profile)| value.selected == profile.key)
                .map(|(index, _)| index as u32)
                .unwrap_or_default(),
            profiles: value.profiles.iter().map(|p| p.clone().into()).collect(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Clone)]
#[serde(rename_all = "PascalCase")]
#[serde(rename = "Game")]
pub struct Profile {
    pub title: String,
    pub installation_path: String,
    pub mods_path: Option<String>,
    pub executable_name: String,
    pub exec_parameters: String,
    #[serde(rename = "LauncherURL")]
    pub launcher_url: String,
    pub ini_prefix: String,
    pub ini_path: Option<String>,
    pub game_edition: GameEdition,
    pub launch_option: LaunchOption,
}

impl From<json::Profile> for Profile {
    fn from(value: json::Profile) -> Self {
        // In v1, the mods path would get extended with a "Mods" folder. In v2, that isn't the case anymore.
        // Attempt to "restore" it, but this isn't a 1-to-1 conversion unfortunately:
        let mut mods_path = Utf8PathBuf::from(value.mods_path);
        if let Some(file_name) = mods_path.file_name()
            && file_name.to_lowercase() == "mods"
            && let Some(parent) = mods_path.parent()
        {
            mods_path = parent.to_path_buf();
        }
        Self {
            title: value.title,
            installation_path: value.installation_path,
            mods_path: Some(mods_path.to_string()),
            executable_name: value.executable_name,
            exec_parameters: value.exec_parameters,
            launcher_url: value.launcher_url,
            ini_prefix: value.ini_prefix,
            ini_path: Some(value.ini_path),
            game_edition: value.game_edition,
            launch_option: value.launch_option,
        }
    }
}
