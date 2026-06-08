#[cfg(test)]
pub mod tests;

mod models;
pub use models::*;

use anyhow::anyhow;
use chrono::{DateTime, Utc};
use reqwest::RequestBuilder;

use crate::info;

pub struct GitHubAPI {
    pub host: String,
    pub rate_limit: Option<RateLimit>,
}

impl Default for GitHubAPI {
    fn default() -> Self {
        Self::new()
    }
}

impl GitHubAPI {
    pub fn new() -> Self {
        Self {
            host: "https://api.github.com".to_string(),
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
            .header("Application-Version", info::APP_VERSION)
            .header("Application-Name", info::APP_NAME)
            .header("User-Agent", info::user_agent())
    }

    pub fn post<S: AsRef<str>>(&self, url_path: S) -> RequestBuilder {
        reqwest::Client::new()
            .post(self.host.clone() + url_path.as_ref())
            .header("Application-Version", info::APP_VERSION)
            .header("Application-Name", info::APP_NAME)
            .header("User-Agent", info::user_agent())
    }

    /// Retrieves rate limit information from the GitHub API.
    /// Uses the /rate_limit endpoint and extracts core rate limit from the JSON body.
    pub async fn get_rate_limit(&mut self) -> anyhow::Result<RateLimit> {
        let resp = self
            .get("/rate_limit")
            .header("Accept", "application/vnd.github.v3+json")
            .send()
            .await?;

        Self::extract_ratelimit_from_headers(&mut self.rate_limit, resp.headers())?;

        let rate_limit = Self::extract_ratelimit_from_body(resp).await?;
        self.rate_limit = Some(rate_limit.clone());

        Ok(rate_limit)
    }

    /// Retrieves the latest release for a repository.
    pub async fn get_latest_release<S: AsRef<str>>(
        &mut self,
        user: S,
        repo: S,
    ) -> anyhow::Result<Release> {
        let resp = self
            .get(format!(
                "/repos/{}/{}/releases/latest",
                user.as_ref(),
                repo.as_ref()
            ))
            .header("Accept", "application/vnd.github.v3+json")
            .send()
            .await?;

        Self::extract_ratelimit_from_headers(&mut self.rate_limit, resp.headers())?;

        let body = resp.text().await?;
        let release: Release = serde_json::from_str(&body)?;

        Ok(release)
    }

    /// Retrieves commits at a specific path in a repository.
    pub async fn get_commits_at_path<S: AsRef<str>>(
        &mut self,
        user: S,
        repo: S,
        path: S,
    ) -> anyhow::Result<Vec<Commit>> {
        let encoded_path = path.as_ref().replace("/", "%2F").replace("\\", "%2F");
        let resp = self
            .get(format!(
                "/repos/{}/{}/commits?path={}&page=1&per_page=1",
                user.as_ref(),
                repo.as_ref(),
                encoded_path
            ))
            .header("Accept", "application/vnd.github.v3+json")
            .send()
            .await?;

        Self::extract_ratelimit_from_headers(&mut self.rate_limit, resp.headers())?;

        let body = resp.text().await?;
        let commits: Vec<Commit> = serde_json::from_str(&body)?;

        Ok(commits)
    }

    /// Retrieves the last commit date at a specific path in a repository.
    pub async fn get_last_commit_date_at_path<S: AsRef<str>>(
        &mut self,
        user: S,
        repo: S,
        path: S,
    ) -> anyhow::Result<Option<DateTime<Utc>>> {
        let commits = self.get_commits_at_path(user, repo, path).await?;
        let first_commit = commits.into_iter().next();

        match first_commit {
            Some(commit) => {
                let date_str = commit
                    .commit
                    .committer
                    .as_ref()
                    .map(|c| c.date.as_str())
                    .or_else(|| commit.commit.author.as_ref().map(|a| a.date.as_str()))
                    .ok_or(anyhow!("No committer or author date found"))?;
                let date = chrono::DateTime::parse_from_rfc3339(date_str)
                    .ok()
                    .map(|dt| dt.with_timezone(&chrono::Utc));
                Ok(date)
            }
            None => Ok(None),
        }
    }

    /// Retrieves the contents of a repository at a specific path.
    pub async fn get_repository_contents<S: AsRef<str>>(
        &mut self,
        user: S,
        repo: S,
        path: S,
    ) -> anyhow::Result<Vec<RepositoryContents>> {
        let encoded_path = path.as_ref().replace("/", "%2F").replace("\\", "%2F");
        let resp = self
            .get(format!(
                "/repos/{}/{}/contents/{}",
                user.as_ref(),
                repo.as_ref(),
                encoded_path
            ))
            .header("Accept", "application/vnd.github.v3+json")
            .send()
            .await?;

        Self::extract_ratelimit_from_headers(&mut self.rate_limit, resp.headers())?;

        let body = resp.text().await?;
        let contents: Vec<RepositoryContents> = serde_json::from_str(&body)?;

        Ok(contents)
    }

    /// Extracts rate limit information from the JSON response body.
    async fn extract_ratelimit_from_body(resp: reqwest::Response) -> anyhow::Result<RateLimit> {
        let body = resp.text().await?;
        let rate_limit_response: RateLimitResponse = serde_json::from_str(&body)?;

        let core = rate_limit_response.resources.core;

        let reset = chrono::DateTime::from_timestamp(core.reset as i64, 0)
            .ok_or(anyhow!("Invalid reset timestamp"))?
            .with_timezone(&chrono::Utc);

        Ok(RateLimit {
            limit: core.limit,
            remaining: core.remaining,
            used: core.used,
            reset,
            exceeded: core.remaining == 0,
        })
    }

    /// Extracts rate limit information from response headers.
    fn extract_ratelimit_from_headers(
        rate_limit: &mut Option<RateLimit>,
        headers: &reqwest::header::HeaderMap,
    ) -> anyhow::Result<()> {
        let header_value_to_num = |opt_val: Option<&reqwest::header::HeaderValue>| {
            opt_val
                .and_then(|val| val.to_str().ok())
                .and_then(|str| str.parse().ok())
        };

        let header_value_to_string = |opt_val: Option<&reqwest::header::HeaderValue>| {
            opt_val
                .and_then(|val| val.to_str().ok())
                .map(|s| s.to_string())
        };

        let limit = header_value_to_num(headers.get("x-ratelimit-limit"))
            .ok_or(anyhow!("Rate limit not found in HTTP headers"))?;
        let remaining = header_value_to_num(headers.get("x-ratelimit-remaining"))
            .ok_or(anyhow!("Rate limit remaining not found in HTTP headers"))?;
        let used = header_value_to_num(headers.get("x-ratelimit-used"))
            .ok_or(anyhow!("Rate limit used not found in HTTP headers"))?;
        let reset_timestamp = header_value_to_num(headers.get("x-ratelimit-reset"))
            .ok_or(anyhow!("Rate limit reset not found in HTTP headers"))?;

        let reset = chrono::DateTime::from_timestamp(reset_timestamp as i64, 0)
            .ok_or(anyhow!("Invalid reset timestamp"))?
            .with_timezone(&chrono::Utc);

        // Log the x-ratelimit-resource header
        if let Some(resource) = header_value_to_string(headers.get("x-ratelimit-resource")) {
            log::trace!("x-ratelimit-resource: {}", resource);
        }

        *rate_limit = Some(RateLimit {
            limit,
            remaining,
            used,
            reset,
            exceeded: remaining == 0,
        });

        Ok(())
    }
}
