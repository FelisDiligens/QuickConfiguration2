//! Legacy XML format (from v1) to save a user's NexusMods account info.

use serde::{Deserialize, Serialize};

use crate::features::nexusmods::models::{api::RL_DATE_TIME_FORMAT, json};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "PascalCase")]
pub struct Account {
    #[serde(rename = "@id")]
    pub id: String,
    #[serde(rename = "Authentification")]
    pub auth: Authentification,
    pub profile: Profile,
    pub rate_limit: RateLimit,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "PascalCase")]
pub struct Authentification {
    #[serde(rename = "APIKey")]
    pub api_key: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "PascalCase")]
pub struct Profile {
    pub username: String,
    pub membership: Membership,
    pub picture: Picture,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "PascalCase")]
pub enum Membership {
    Basic,
    Supporter,
    Premium,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "PascalCase")]
pub struct Picture {
    #[serde(rename = "@url")]
    pub url: String,
    #[serde(rename = "@file")]
    pub file: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "PascalCase")]
pub struct RateLimit {
    #[serde(rename = "@daily")]
    pub daily: u32,
    #[serde(rename = "@hourly")]
    pub hourly: u32,
    pub daily_reset_time: String,
    pub hourly_reset_time: String,
}

impl From<json::AccountInfo> for Account {
    fn from(value: json::AccountInfo) -> Self {
        Self {
            id: value.profile.user_id.to_string(),
            auth: Authentification {
                api_key: value.profile.api_key,
            },
            profile: Profile {
                username: value.profile.name,
                membership: value.profile.membership.into(),
                picture: Picture {
                    url: value.profile.profile_url,
                    file: "profile.webp".to_string(),
                },
            },
            rate_limit: value.rate_limit.into(),
        }
    }
}

impl From<json::Membership> for Membership {
    fn from(value: json::Membership) -> Self {
        match value {
            json::Membership::Basic => Membership::Basic,
            json::Membership::Supporter => Membership::Supporter,
            json::Membership::Premium => Membership::Premium,
        }
    }
}

impl From<json::RateLimit> for RateLimit {
    fn from(value: json::RateLimit) -> Self {
        Self {
            daily: value.daily_remaining,
            hourly: value.hourly_remaining,
            daily_reset_time: value.daily_reset.format(RL_DATE_TIME_FORMAT).to_string(),
            hourly_reset_time: value.hourly_reset.format(RL_DATE_TIME_FORMAT).to_string(),
        }
    }
}
