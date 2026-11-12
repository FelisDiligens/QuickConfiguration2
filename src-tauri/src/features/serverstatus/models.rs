//! API models for the Bethesda server status API and the locize localization API.

use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use specta::Type;

/// Response from `https://status.bethesda.net/en/status/api/statuses`.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StatusResponse {
    pub components: Vec<StatusComponent>,
}

/// A single component in the Bethesda status API response.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StatusComponent {
    pub id: String,
    pub name: String,
    pub status: String,
}

/// Response from the locize API, e.g. `https://api.locize.app/<project>/live/en/status`.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LocizeResponse {
    pub status_key: Option<HashMap<String, String>>,
}

/// The normalized Fallout 76 server status.
#[derive(Debug, Serialize, Deserialize, Type, Clone, Copy, PartialEq, Eq)]
pub enum ServerStatus {
    Operational,
    Maintenance,
    DegradedPerformance,
    PartialOutage,
    MajorOutage,
}

impl ServerStatus {
    /// Maps a raw status string from the status API to a normalized status.
    pub fn from_api_status(status: &str) -> Option<Self> {
        match status {
            "operational" | "all_systems_operational" => Some(Self::Operational),
            "maintenance" | "under_maintenance" | "service_under_maintenance" => {
                Some(Self::Maintenance)
            }
            "degraded_performance" | "partially_degraded_service" => {
                Some(Self::DegradedPerformance)
            }
            "partial_outage" | "partial_system_outage" | "minor_service_outage" => {
                Some(Self::PartialOutage)
            }
            "major_outage" | "major_system_outage" => Some(Self::MajorOutage),
            _ => None,
        }
    }

    /// The key of this status in the locize localization.
    pub fn status_key(&self) -> &'static str {
        match self {
            Self::Operational => "operational",
            Self::Maintenance => "maintenance",
            Self::DegradedPerformance => "degraded",
            Self::PartialOutage => "partial",
            Self::MajorOutage => "major",
        }
    }
}

/// The result of fetching the localized server status.
#[derive(Debug, Serialize, Deserialize, Type, Clone)]
pub struct LocalizedServerStatus {
    pub status: ServerStatus,
    pub message: String,
}
