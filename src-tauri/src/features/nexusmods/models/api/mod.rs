//! API models for NexusMods API.

#[cfg(test)]
pub mod tests;

use anyhow::anyhow;
use regex::Regex;
use serde::{Deserialize, Serialize};
use specta::Type;

/// The date format returned from the NexusMods API for rate limit headers.
/// e.g. `2026-03-07 17:21:29 +0000`
pub const RL_DATE_TIME_FORMAT: &str = "%Y-%m-%d %H:%M:%S %z";

#[derive(Debug, Clone)]
pub enum ModID {
    URL(String),
    IDs(String, u32),
}

impl ModID {
    pub fn into_game_scoped_id(self) -> anyhow::Result<u32> {
        match self {
            ModID::IDs(_, game_scoped_id) => Ok(game_scoped_id),
            ModID::URL(url) => {
                // Example: https://www.nexusmods.com/fallout76/mods/546?tab=files
                let re = Regex::new(
                    r".*?www\.nexusmods\.com/\w+/mods/(?P<game_scoped_id>\d+)(/?\?.*)?",
                )?;
                let cap = re
                    .captures(&url)
                    .ok_or(anyhow!("Regex didn't match given URL: {url}"))?;
                let game_scoped_id: u32 = cap
                    .name("game_scoped_id")
                    .ok_or(anyhow!("Couldn't extract game_scoped_id from URL: {url}"))?
                    .as_str()
                    .parse()?;
                Ok(game_scoped_id)
            }
        }
    }

    pub fn into_ids(self) -> anyhow::Result<(String, u32)> {
        match self {
            ModID::IDs(game_domain, game_scoped_id) => Ok((game_domain, game_scoped_id)),
            ModID::URL(url) => {
                // Example: https://www.nexusmods.com/fallout76/mods/546?tab=files
                let re = Regex::new(
                    r".*?www\.nexusmods\.com/(?P<game_domain>\w+)/mods/(?P<game_scoped_id>\d+)(/?\?.*)?",
                )?;
                let cap = re
                    .captures(&url)
                    .ok_or(anyhow!("Regex didn't match given URL: {url}"))?;
                let game_domain = cap
                    .name("game_domain")
                    .ok_or(anyhow!("Couldn't extract game_domain from URL: {url}"))?
                    .as_str()
                    .to_owned();
                let game_scoped_id: u32 = cap
                    .name("game_scoped_id")
                    .ok_or(anyhow!("Couldn't extract game_scoped_id from URL: {url}"))?
                    .as_str()
                    .parse()?;
                Ok((game_domain, game_scoped_id))
            }
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub struct Profile {
    pub user_id: u32,
    pub key: String,
    pub name: String,
    pub email: String,
    pub profile_url: String,
    pub is_supporter: bool,
    pub is_premium: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RateLimit {
    /// HTTP Header `x-rl-daily-limit`
    pub daily_limit: u32,
    /// HTTP Header `x-rl-daily-remaining`
    pub daily_remaining: u32,
    /// HTTP Header `x-rl-daily-reset`
    pub daily_reset: chrono::DateTime<chrono::FixedOffset>,
    /// HTTP Header `x-rl-hourly-limit`
    pub hourly_limit: u32,
    /// HTTP Header `x-rl-hourly-remaining`
    pub hourly_remaining: u32,
    /// HTTP Header `x-rl-hourly-reset`
    pub hourly_reset: chrono::DateTime<chrono::FixedOffset>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub struct ModInfo {
    /// The mod's name or title
    pub name: String,
    /// A short summary of the mod
    pub summary: String,
    /// The full description as seen when navigating to the mod's page. Formatted with BBCode.
    pub description: String,
    /// URL to a PNG with domain staticdelivery.nexusmods.com.
    pub picture_url: String,
    pub mod_downloads: u32,
    pub mod_unique_downloads: u32,
    pub uid: u64,
    pub mod_id: u32,
    pub game_id: u32,
    pub allow_rating: bool,
    pub domain_name: String,
    pub category_id: u32,
    pub version: String,
    pub endorsement_count: u32,
    /// Unix timestamp
    pub created_timestamp: u64,
    /// "2020-04-10T13:50:33.000+00:00"
    pub created_time: chrono::DateTime<chrono::Utc>,
    /// Unix timestamp
    pub updated_timestamp: u64,
    /// "2025-07-20T19:48:04.000+00:00"
    pub updated_time: chrono::DateTime<chrono::Utc>,
    pub author: String,
    pub uploaded_by: String,
    pub uploaded_users_profile_url: String,
    pub contains_adult_content: bool,
    /// "published"
    pub status: String,
    pub available: bool,
    pub user: ModInfoUser,
    pub endorsement: ModInfoEndorsement,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub struct ModInfoUser {
    pub member_id: u32,
    pub member_group_id: u32,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub struct ModInfoEndorsement {
    pub endorse_status: EndorseStatus,
    pub timestamp: Option<u64>, // Unix timestamp
    pub version: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Clone)]
pub enum EndorseStatus {
    Endorsed,
    Abstained,
    Undecided,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EndorseAbstainAPIResponse {
    pub status: String,
    pub message: String,
}

#[derive(Serialize, Deserialize, strum::Display, Type, Debug, PartialEq, Clone)]
#[serde(rename_all = "snake_case")]
#[strum(serialize_all = "snake_case")]
pub enum FileCategory {
    Main,
    Update,
    Optional,
    OldVersion,
    Miscellaneous,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileUpdate {
    pub old_file_id: u32,
    pub new_file_id: u32,
    pub old_file_name: String,
    pub new_file_name: String,
    pub uploaded_timestamp: u64,
    pub uploaded_time: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ModFile {
    pub id: Vec<u32>,
    pub uid: u64,
    pub file_id: u32,
    pub name: String,
    pub version: String,
    pub category_id: u32,
    pub category_name: String,
    pub is_primary: bool,
    pub size: u32,
    pub file_name: String,
    pub uploaded_timestamp: u64,
    pub uploaded_time: chrono::DateTime<chrono::Utc>,
    pub mod_version: String,
    pub external_virus_scan_url: Option<String>,
    pub description: String,
    pub size_kb: u32,
    pub size_in_bytes: u64,
    pub changelog_html: Option<String>,
    pub content_preview_link: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ModFiles {
    pub file_updates: Vec<FileUpdate>,
    pub files: Vec<ModFile>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DownloadLink {
    pub name: String,
    pub short_name: String,
    #[serde(rename = "URI")]
    pub uri: String,
}
