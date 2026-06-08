//! New JSON format for a user's NexusMods account info.

use serde::{Deserialize, Serialize};
use specta::Type;

use crate::features::nexusmods::models::api;
use crate::features::nexusmods::models::xml;

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
#[serde(rename_all = "camelCase")]
#[specta(rename = "NexusModsAccountInfo")]
pub struct AccountInfo {
    pub profile: Profile,
    pub rate_limit: RateLimit,
}

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
#[serde(rename_all = "camelCase")]
#[specta(rename = "NexusModsProfile")]
pub struct Profile {
    pub user_id: u32,
    pub api_key: String,
    pub name: String,
    pub email: String,
    pub profile_url: String,
    pub membership: Membership,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Type)]
#[serde(rename_all = "PascalCase")]
#[specta(rename = "NexusModsMembership")]
pub enum Membership {
    Basic,
    Supporter,
    Premium,
}

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
#[serde(rename_all = "camelCase")]
#[specta(rename = "NexusModsRateLimit")]
pub struct RateLimit {
    pub daily_limit: u32,
    pub daily_remaining: u32,
    #[specta(type = String)] // will be formatted as RFC3339
    pub daily_reset: chrono::DateTime<chrono::Utc>,
    pub hourly_limit: u32,
    pub hourly_remaining: u32,
    #[specta(type = String)] // will be formatted as RFC3339
    pub hourly_reset: chrono::DateTime<chrono::Utc>,
}

impl TryFrom<xml::Account> for AccountInfo {
    type Error = anyhow::Error;

    fn try_from(value: xml::Account) -> Result<Self, Self::Error> {
        Ok(Self {
            profile: Profile {
                user_id: value.id.parse()?,
                api_key: value.auth.api_key,
                name: value.profile.username,
                email: String::default(),
                profile_url: value.profile.picture.url,
                membership: value.profile.membership.into(),
            },
            rate_limit: value.rate_limit.try_into()?,
        })
    }
}

impl From<api::Profile> for Profile {
    fn from(value: api::Profile) -> Self {
        Self {
            user_id: value.user_id,
            api_key: value.key,
            name: value.name,
            email: value.email,
            profile_url: value.profile_url,
            membership: if value.is_premium {
                Membership::Premium
            } else if value.is_supporter {
                Membership::Supporter
            } else {
                Membership::Basic
            },
        }
    }
}

impl From<xml::Membership> for Membership {
    fn from(value: xml::Membership) -> Self {
        match value {
            xml::Membership::Basic => Membership::Basic,
            xml::Membership::Supporter => Membership::Supporter,
            xml::Membership::Premium => Membership::Premium,
        }
    }
}

impl TryFrom<xml::RateLimit> for RateLimit {
    type Error = anyhow::Error;

    fn try_from(value: xml::RateLimit) -> Result<Self, Self::Error> {
        Ok(Self {
            daily_limit: 20000,
            daily_remaining: value.daily,
            daily_reset: chrono::DateTime::parse_from_str(
                &value.daily_reset_time,
                api::RL_DATE_TIME_FORMAT,
            )?
            .to_utc(),
            hourly_limit: 500,
            hourly_remaining: value.hourly,
            hourly_reset: chrono::DateTime::parse_from_str(
                &value.hourly_reset_time,
                api::RL_DATE_TIME_FORMAT,
            )?
            .to_utc(),
        })
    }
}

impl From<api::RateLimit> for RateLimit {
    fn from(value: api::RateLimit) -> Self {
        Self {
            daily_limit: value.daily_limit,
            daily_remaining: value.daily_remaining,
            daily_reset: value.daily_reset.to_utc(),
            hourly_limit: value.hourly_limit,
            hourly_remaining: value.hourly_remaining,
            hourly_reset: value.hourly_reset.to_utc(),
        }
    }
}
