use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Serialize, Deserialize, Debug, Clone, Type)]
#[serde(rename_all = "kebab-case", tag = "status")]
pub enum ModsDeployProgress {
    Preparing,
    #[serde(rename_all = "camelCase")]
    Removing {
        progress: ModsRemoveProgress,
    },
    #[serde(rename_all = "camelCase")]
    Deploying {
        /// The name of the mod that is currently being deployed
        mod_title: String,
        /// Number of deployed mods (0..total, excluding total)
        deployed_mods: u32,
        /// Number of mods to deploy in total
        total_mods: u32,
        /// The current progress on the mod deployment
        progress: ModDeployProgress,
    },
    Finished,
}

#[derive(Serialize, Deserialize, Debug, Clone, Type)]
#[serde(rename_all = "kebab-case", tag = "status")]
pub enum ModDeployProgress {
    Preparing,
    #[serde(rename_all = "camelCase")]
    Copying {
        /// Current file name that is being copied
        file_name: String,
        /// Number of copied files (0..total, excluding total)
        copied: u32,
        /// Number of files to copy in total
        total: u32,
    },
    #[serde(rename_all = "camelCase")]
    Finished {
        /// Number of files that were copied
        copied: u32,
        /// Number of archives that were added to the resource list
        resources: u32,
    },
}

#[derive(Serialize, Deserialize, Debug, Clone, Type)]
#[serde(rename_all = "kebab-case", tag = "status")]
pub enum ModsRemoveProgress {
    Preparing,
    #[serde(rename_all = "camelCase")]
    Removing {
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
    Finalizing,
    #[serde(rename_all = "camelCase")]
    Finished {
        /// Number of mods that were removed
        removed_mods: u32,
        /// Number of archives that were removed from the resource list
        removed_resources: u32,
    },
}
