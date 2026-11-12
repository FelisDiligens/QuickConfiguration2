#[cfg(test)]
pub mod tests;

mod models;
pub use models::*;

use anyhow::anyhow;
use reqwest::RequestBuilder;

use crate::info;

/// Component ID of "Fallout 76" in the Bethesda status API.
const FALLOUT76_COMPONENT_ID: &str = "m39k311rzvkg";
/// Component name of "Fallout 76" in the Bethesda status API.
const FALLOUT76_COMPONENT_NAME: &str = "Fallout 76";

pub struct ServerStatusAPI {
    pub bethesda_host: String,
    pub locize_host: String,
}

impl Default for ServerStatusAPI {
    fn default() -> Self {
        Self::new()
    }
}

impl ServerStatusAPI {
    pub fn new() -> Self {
        Self {
            bethesda_host: "https://status.bethesda.net".to_string(),
            locize_host: "https://api.locize.app/657e9e0e-8225-4266-88dd-75f047f1a2b3".to_string(),
        }
    }

    pub fn with_host<S: AsRef<str>>(mut self, host: S) -> Self {
        let host = host.as_ref().to_string();
        self.bethesda_host = host.clone();
        self.locize_host = host;
        self
    }

    pub fn get<S: AsRef<str>>(&self, url: S) -> RequestBuilder {
        reqwest::Client::new()
            .get(url.as_ref())
            .header("Application-Version", info::APP_VERSION)
            .header("Application-Name", info::APP_NAME)
            .header("User-Agent", info::user_agent())
    }

    /// Fetches the raw status string of the Fallout 76 component from the Bethesda status API.
    pub async fn fetch_server_status(&self) -> anyhow::Result<String> {
        let resp = self
            .get(format!("{}/en/status/api/statuses", self.bethesda_host))
            .send()
            .await?;

        let body = resp.text().await?;
        let json: StatusResponse = serde_json::from_str(&body)?;

        for component in json.components {
            if component.id == FALLOUT76_COMPONENT_ID || component.name == FALLOUT76_COMPONENT_NAME
            {
                return Ok(component.status);
            }
        }
        Err(anyhow!("Fallout 76 not found in API response."))
    }

    /// Fetches the localized message for a status key from the locize API.
    /// Falls back to English if the translation does not exist for the given language.
    pub async fn fetch_localized_status_message(
        &self,
        language: &str,
        status_key: &str,
    ) -> anyhow::Result<String> {
        // If the translation does not exist, the server returns an empty JSON object {},
        // in this situation, fallback to English:
        let language = language.to_lowercase();
        let mut languages = vec![language.clone()];
        if language != "en" {
            languages.push("en".to_string());
        }

        for language in languages {
            let resp = self
                .get(format!("{}/live/{}/status", self.locize_host, language))
                .send()
                .await?;

            let body = resp.text().await?;
            let json: LocizeResponse = serde_json::from_str(&body)?;

            if let Some(status_keys) = json.status_key
                && let Some(message) = status_keys.get(status_key)
            {
                return Ok(message.clone());
            }
        }

        Err(anyhow!("statusKey not found in localization."))
    }

    /// Fetches the Fallout 76 server status together with a localized message describing it.
    pub async fn fetch_localized_server_status(
        &self,
        language: &str,
    ) -> anyhow::Result<LocalizedServerStatus> {
        let status_string = self.fetch_server_status().await?;
        let status = ServerStatus::from_api_status(&status_string)
            .ok_or_else(|| anyhow!("Unknown status: {status_string}"))?;

        let message = match self
            .fetch_localized_status_message(language, status.status_key())
            .await
        {
            Ok(message) if !message.is_empty() => message,
            Ok(_) => status_string.clone(),
            Err(err) => {
                log::error!("Couldn't fetch localized message: {err}");
                status_string.clone()
            }
        };

        Ok(LocalizedServerStatus { status, message })
    }
}
