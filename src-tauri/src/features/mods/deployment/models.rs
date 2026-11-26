use serde::{Deserialize, Serialize};
use specta::Type;
use tauri_specta::Event;

pub const MODS_DEPLOY_PROGRESS_EVENT: &str = "mods-deploy-progress";

/// Progress updates emitted while deploying mods to the game folder.
#[derive(Serialize, Deserialize, Debug, Clone, Type, Event)]
#[serde(rename_all = "kebab-case", tag = "status")]
pub enum ModsDeployProgress {
    #[serde(rename_all = "camelCase")]
    Comparing {
        /// The name of the mod whose files are currently being compared
        mod_title: String,
        /// Number of compared mods (0..total, excluding total)
        compared_mods: u32,
        /// Number of mods to deploy in total
        total_mods: u32,
    },
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
    #[serde(rename_all = "camelCase")]
    FinishedModDeployment {
        /// The name of the mod that was deployed
        mod_title: String,
        /// Number of deployed mods (0..total, excluding total)
        deployed_mods: u32,
        /// Number of mods to deploy in total
        total_mods: u32,
        /// Number of files that were copied
        copied: u32,
        /// Number of files that were skipped because they were identical
        skipped: u32,
        /// Number of archives that were added to the resource list
        resources: u32,
    },
}
