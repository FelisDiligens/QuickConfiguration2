use std::{fmt::Display, str::FromStr};

use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Debug, Serialize, Deserialize, PartialEq, Clone, Type)]
pub enum LaunchOption {
    OpenURL,
    RunExec,
}

impl Display for LaunchOption {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{:?}", self)
    }
}

impl FromStr for LaunchOption {
    type Err = ();
    fn from_str(input: &str) -> Result<LaunchOption, Self::Err> {
        match input {
            "OpenURL" => Ok(LaunchOption::OpenURL),
            "RunExec" => Ok(LaunchOption::RunExec),
            _ => Err(()),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Clone, Type)]
pub enum GameEdition {
    Unknown,
    Steam,
    SteamPTS,
    Xbox,
    /// Legacy, for back-compat
    MSStore,
    /// Legacy, for back-compat
    BethesdaNet,
    /// Legacy, for back-compat
    BethesdaNetPTS,
}

impl Display for GameEdition {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{:?}", self)
    }
}

impl FromStr for GameEdition {
    type Err = ();
    fn from_str(input: &str) -> Result<GameEdition, Self::Err> {
        match input {
            "Unknown" => Ok(GameEdition::Unknown),
            "Steam" => Ok(GameEdition::Steam),
            "SteamPTS" => Ok(GameEdition::SteamPTS),
            "Xbox" => Ok(GameEdition::Xbox),
            "MSStore" => Ok(GameEdition::MSStore),
            "BethesdaNet" => Ok(GameEdition::BethesdaNet),
            "BethesdaNetPTS" => Ok(GameEdition::BethesdaNetPTS),
            _ => Err(()),
        }
    }
}
