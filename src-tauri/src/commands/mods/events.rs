use serde::{Deserialize, Serialize};
use specta::Type;
use tauri_specta::Event;

use crate::features::mods::deployment::{
    ModDeployProgress, ModsDeployProgress, ModsRemoveProgress,
};

#[derive(Serialize, Deserialize, Debug, Clone, Type, Event)]
#[serde(rename_all = "kebab-case", tag = "status")]
pub enum ModsDeployProgressUpdate {
    Preparing,
    PreparingRemoval,
    #[serde(rename_all = "camelCase")]
    RemovingMod {
        /// The name of the mod that is currently being removed
        mod_title: String,
        /// Number of removed mods (0..total, excluding total)
        removed_mods: u32,
        /// Number of mods to remove in total
        total_mods: u32,
        /// Current file name that is being removed
        file_name: String,
        /// Number of removed files (0..total, excluding total)
        removed_files: u32,
        /// Number of files to remove in total
        total_files: u32,
    },
    FinalizingRemoval,
    #[serde(rename_all = "camelCase")]
    FinishedRemoval {
        /// Number of mods that were removed
        removed_mods: u32,
        /// Number of archives that were removed from the resource list
        removed_resources: u32,
    },
    PreparingDeployment,
    #[serde(rename_all = "camelCase")]
    PreparingDeploymentOfMod {
        /// The name of the mod that is currently being deployed
        mod_title: String,
        /// Number of deployed mods (0..total, excluding total)
        deployed_mods: u32,
        /// Number of mods to deploy in total
        total_mods: u32,
    },
    #[serde(rename_all = "camelCase")]
    DeployingMod {
        /// The name of the mod that is currently being deployed
        mod_title: String,
        /// Number of deployed mods (0..total, excluding total)
        deployed_mods: u32,
        /// Number of mods to deploy in total
        total_mods: u32,
        /// Current file name that is being copied
        file_name: String,
        /// Number of copied files (0..total, excluding total)
        copied_files: u32,
        /// Number of files to copy in total
        total_files: u32,
    },
    FinishedDeployment,
    Finished,
}
pub const MODS_DEPLOY_PROGRESS_UPDATE_EVENT: &str = "mods-deploy-progress-update";

impl TryFrom<ModsDeployProgress> for ModsDeployProgressUpdate {
    type Error = anyhow::Error;

    fn try_from(value: ModsDeployProgress) -> Result<Self, Self::Error> {
        match value {
            ModsDeployProgress::Preparing => Ok(ModsDeployProgressUpdate::Preparing),
            ModsDeployProgress::Removing { progress } => match progress {
                ModsRemoveProgress::Preparing => Ok(ModsDeployProgressUpdate::PreparingRemoval),
                ModsRemoveProgress::Removing {
                    mod_title,
                    removed_mods,
                    total_mods,
                    file_name,
                    removed_files,
                    total_files,
                } => Ok(ModsDeployProgressUpdate::RemovingMod {
                    mod_title,
                    removed_mods,
                    total_mods,
                    file_name,
                    removed_files,
                    total_files,
                }),
                ModsRemoveProgress::Finalizing => Ok(ModsDeployProgressUpdate::FinalizingRemoval),
                ModsRemoveProgress::Finished {
                    removed_mods,
                    removed_resources,
                } => Ok(ModsDeployProgressUpdate::FinishedRemoval {
                    removed_mods,
                    removed_resources,
                }),
            },
            ModsDeployProgress::Deploying {
                mod_title,
                deployed_mods,
                total_mods,
                progress,
            } => match progress {
                ModDeployProgress::Preparing => {
                    Ok(ModsDeployProgressUpdate::PreparingDeploymentOfMod {
                        mod_title,
                        deployed_mods,
                        total_mods,
                    })
                }
                ModDeployProgress::Copying {
                    file_name,
                    copied,
                    total,
                } => Ok(ModsDeployProgressUpdate::DeployingMod {
                    mod_title,
                    deployed_mods,
                    total_mods,
                    file_name,
                    copied_files: copied,
                    total_files: total,
                }),
                ModDeployProgress::Finished { .. } => {
                    Err(anyhow::anyhow!("Cannot convert Deploying -> Finished"))
                }
            },
            ModsDeployProgress::Finished => Ok(ModsDeployProgressUpdate::Finished),
        }
    }
}
