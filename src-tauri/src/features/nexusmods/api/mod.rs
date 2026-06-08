#[cfg(test)]
pub mod tests;

use std::fs;

use anyhow::anyhow;
use reqwest::RequestBuilder;
use tap::TapFallible;
use tauri::http;

use crate::features::nexusmods::get_legacy_nexusmods_thumbnails_path;
use crate::features::nexusmods::models::api::RL_DATE_TIME_FORMAT;
use crate::features::nexusmods::models::{api, json};
use crate::features::screenshots::thumbnails;
use crate::info;

pub struct NexusModsAPI {
    pub host: String,
    pub api_key: String,
    pub rate_limit: Option<api::RateLimit>,
}

impl NexusModsAPI {
    pub fn new<S: AsRef<str>>(api_key: S) -> Self {
        Self {
            host: "https://api.nexusmods.com".to_string(),
            api_key: api_key.as_ref().to_string(),
            rate_limit: None,
        }
    }

    pub fn with_host<S: AsRef<str>>(mut self, host: S) -> Self {
        self.host = host.as_ref().to_string();
        self
    }

    pub fn get<S: AsRef<str>>(&self, url_path: S) -> RequestBuilder {
        reqwest::Client::new()
            .get(self.host.clone() + url_path.as_ref())
            .header("apikey", self.api_key.clone())
            .header("Application-Version", info::APP_VERSION)
            .header("Application-Name", info::APP_NAME)
            .header("User-Agent", info::user_agent())
    }

    pub fn post<S: AsRef<str>>(&self, url_path: S) -> RequestBuilder {
        reqwest::Client::new()
            .post(self.host.clone() + url_path.as_ref())
            .header("apikey", self.api_key.clone())
            .header("Application-Version", info::APP_VERSION)
            .header("Application-Name", info::APP_NAME)
            .header("User-Agent", info::user_agent())
    }

    /// Checks an API key is valid and returns the user's details.
    pub async fn validate(&mut self) -> anyhow::Result<json::AccountInfo> {
        let resp = self
            .get("/v1/users/validate.json")
            .header("Accept", "application/json")
            .send()
            .await?;
        let rate_limit = NexusModsAPI::extract_ratelimit_headers(resp.headers())?;
        self.rate_limit = Some(rate_limit.clone());

        let body = resp.text_with_charset("utf-8").await?;
        let profile: api::Profile = serde_json::from_str(&body)?;

        Ok(json::AccountInfo {
            profile: profile.into(),
            rate_limit: rate_limit.into(),
        })
    }

    /// Retrieve specified mod, from a specified game.
    pub async fn retrieve_modinfo(&mut self, r#mod: api::ModID) -> anyhow::Result<json::ModInfo> {
        let (game_domain, game_scoped_id) = r#mod.into_ids()?;
        let resp = self
            .get(format!(
                "/v1/games/{game_domain}/mods/{game_scoped_id}.json"
            ))
            .header("Accept", "application/json")
            .send()
            .await?;
        self.rate_limit = NexusModsAPI::extract_ratelimit_headers(resp.headers()).ok();

        let body = resp.text_with_charset("utf-8").await?;
        log::trace!("Server response: {:?}", body);
        let mod_info: api::ModInfo = serde_json::from_str(&body)?;
        let mut mod_info: json::ModInfo = mod_info.into();

        let _ = Self::download_and_create_thumbnail(&mut mod_info)
            .await
            .tap_err(|err| log::error!("In retrieve_modinfo: {}", err));

        Ok(mod_info)
    }

    async fn download_and_create_thumbnail(mod_info: &mut json::ModInfo) -> anyhow::Result<()> {
        // Create thumbnail folder:
        let Some(thumbnail_path) = get_legacy_nexusmods_thumbnails_path() else {
            anyhow::bail!("Couldn't determine thumbnail path");
        };
        fs::create_dir_all(&thumbnail_path)?;

        // Create thumbnail:
        let filename = format!("thumb_{}.jpg", mod_info.game_scoped_id);
        thumbnails::create_thumbnail_from_url(
            &mod_info.picture_url,
            thumbnail_path.join(&filename),
        )
        .await?;

        // Update mod info:
        mod_info.thumbnail_filename = Some(filename);
        Ok(())
    }

    /// Endorse a mod
    pub async fn endorse<S: AsRef<str>>(
        &mut self,
        r#mod: api::ModID,
        mod_version: S,
    ) -> anyhow::Result<()> {
        let (game_domain, game_scoped_id) = r#mod.into_ids()?;
        let resp = self
            .post(format!(
                "/v1/games/{game_domain}/mods/{game_scoped_id}/endorse.json"
            ))
            .header("Content-Type", "application/x-www-form-urlencoded")
            .header("Accept", "application/json")
            .body(format!("version={}", mod_version.as_ref()))
            .send()
            .await?;
        self.rate_limit = NexusModsAPI::extract_ratelimit_headers(resp.headers()).ok();

        let body = resp.text_with_charset("utf-8").await?;
        log::trace!("Server response: {:?}", body);
        let result: api::EndorseAbstainAPIResponse = serde_json::from_str(&body)?;
        if result.status != "Endorsed" {
            anyhow::bail!("Couldn't endorse mod. Server message: {}", result.message);
        }
        Ok(())
    }

    /// Abstain from endorsing a mod
    pub async fn abstain<S: AsRef<str>>(
        &mut self,
        r#mod: api::ModID,
        mod_version: S,
    ) -> anyhow::Result<()> {
        let (game_domain, game_scoped_id) = r#mod.into_ids()?;
        let resp = self
            .post(format!(
                "/v1/games/{game_domain}/mods/{game_scoped_id}/abstain.json"
            ))
            .header("Content-Type", "application/x-www-form-urlencoded")
            .header("Accept", "application/json")
            .body(format!("version={}", mod_version.as_ref()))
            .send()
            .await?;
        self.rate_limit = NexusModsAPI::extract_ratelimit_headers(resp.headers()).ok();

        let body = resp.text_with_charset("utf-8").await?;
        log::trace!("Server response: {:?}", body);
        let result: api::EndorseAbstainAPIResponse = serde_json::from_str(&body)?;
        if result.status != "Abstained" {
            anyhow::bail!(
                "Couldn't abstain from endorsing mod. Server message: {}",
                result.message
            );
        }
        Ok(())
    }

    /// Lists all files for a specific mod
    pub async fn list_mod_files(
        &mut self,
        r#mod: api::ModID,
        category: Option<api::FileCategory>,
    ) -> anyhow::Result<json::ModFiles> {
        let (game_domain, game_scoped_id) = r#mod.into_ids()?;
        let mut url = format!("/v1/games/{game_domain}/mods/{game_scoped_id}/files.json");
        if let Some(category) = category {
            url.push_str(&format!("?category={}", category));
        }
        let resp = self
            .get(url)
            .header("Accept", "application/json")
            .send()
            .await?;
        self.rate_limit = NexusModsAPI::extract_ratelimit_headers(resp.headers()).ok();

        let body = resp.text_with_charset("utf-8").await?;
        log::trace!("Server response: {:?}", body);
        let mod_files: api::ModFiles = serde_json::from_str(&body)?;
        Ok(mod_files.into())
    }

    /// Generate download links for mod file
    pub async fn request_download_links(
        &mut self,
        game_domain: String,
        game_scoped_id: u64,
        file_id: u64,
        key: Option<String>,
        expires: Option<u64>,
    ) -> anyhow::Result<Vec<json::DownloadLink>> {
        let mut url = format!(
            "/v1/games/{}/mods/{}/files/{}/download_link.json",
            game_domain, game_scoped_id, file_id
        );
        if let Some(key) = key {
            url.push_str(&format!("?key={}", key));
        }
        if let Some(expires) = expires {
            url.push_str(&format!("&expires={}", expires));
        }
        let resp = self
            .get(url)
            .header("Accept", "application/json")
            .send()
            .await?;
        self.rate_limit = NexusModsAPI::extract_ratelimit_headers(resp.headers()).ok();

        let body = resp.text_with_charset("utf-8").await?;
        log::trace!("Server response: {:?}", body);
        let download_links: Vec<api::DownloadLink> = serde_json::from_str(&body)?;
        Ok(download_links
            .into_iter()
            .map(json::DownloadLink::from)
            .collect())
    }

    fn extract_ratelimit_headers(headers: &http::HeaderMap) -> anyhow::Result<api::RateLimit> {
        let header_value_to_num = |opt_val: Option<&http::HeaderValue>| {
            opt_val
                .and_then(|val| val.to_str().ok())
                .and_then(|str| str.parse().ok())
        };

        let header_value_to_string = |opt_val: Option<&http::HeaderValue>| {
            opt_val
                .and_then(|val| val.to_str().ok())
                .map(|s| s.to_string())
        };

        Ok(api::RateLimit {
            daily_limit: header_value_to_num(headers.get("x-rl-daily-limit"))
                .ok_or(anyhow!("Daily limit not found in HTTP headers"))?,
            daily_remaining: header_value_to_num(headers.get("x-rl-daily-remaining"))
                .ok_or(anyhow!("Daily remaining not found in HTTP headers"))?,
            daily_reset: chrono::DateTime::parse_from_str(
                &header_value_to_string(headers.get("x-rl-daily-reset"))
                    .ok_or(anyhow!("Daily reset not found in HTTP headers"))?,
                RL_DATE_TIME_FORMAT,
            )?,
            hourly_limit: header_value_to_num(headers.get("x-rl-hourly-limit"))
                .ok_or(anyhow!("Hourly limit not found in HTTP headers"))?,
            hourly_remaining: header_value_to_num(headers.get("x-rl-hourly-remaining"))
                .ok_or(anyhow!("Hourly remaining not found in HTTP headers"))?,
            hourly_reset: chrono::DateTime::parse_from_str(
                &header_value_to_string(headers.get("x-rl-hourly-reset"))
                    .ok_or(anyhow!("Hourly reset not found in HTTP headers"))?,
                RL_DATE_TIME_FORMAT,
            )?,
        })
    }
}
