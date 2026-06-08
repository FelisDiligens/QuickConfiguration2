//! API models for GitHub API.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Rate limit information for the GitHub API.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RateLimit {
    /// The maximum number of requests per hour.
    pub limit: u32,
    /// The number of requests remaining.
    pub remaining: u32,
    /// The number of requests used.
    pub used: u32,
    /// Unix timestamp when the rate limit resets.
    pub reset: DateTime<Utc>,
    /// Whether the rate limit has been exceeded.
    pub exceeded: bool,
}

/// A simple GitHub user object.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub struct User {
    pub login: String,
    pub id: u64,
    pub html_url: String,
}

/// A Git user (author/committer in commit details).
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub struct CommitAuthor {
    pub name: String,
    pub email: String,
    pub date: String,
}

/// Details of a commit.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub struct CommitDetails {
    #[serde(default)]
    pub author: Option<CommitAuthor>,
    #[serde(default)]
    pub committer: Option<CommitAuthor>,
    pub message: String,
}

/// Information about a commit.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub struct Commit {
    pub sha: String,
    pub html_url: String,
    pub commit: CommitDetails,
    #[serde(default)]
    pub author: Option<User>,
    #[serde(default)]
    pub committer: Option<User>,
}

/// Information about a release asset.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub struct ReleaseAsset {
    pub browser_download_url: String,
    pub id: u64,
    pub name: String,
    #[serde(default)]
    pub label: Option<String>,
    pub uploader: Option<User>,
    pub content_type: String,
    pub state: String,
    pub size: u64,
    #[serde(default)]
    pub download_count: u32,
    pub created_at: String,
    pub updated_at: String,
}

/// Information about a GitHub release.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub struct Release {
    pub html_url: String,
    pub id: u64,
    pub tag_name: String,
    pub target_commitish: String,
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub body: Option<String>,
    pub draft: bool,
    pub prerelease: bool,
    pub created_at: String,
    pub updated_at: Option<String>,
    pub published_at: Option<String>,
    pub author: User,
    pub assets: Vec<ReleaseAsset>,
}

/// Rate limit information for a specific resource.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub struct RateLimitCore {
    pub limit: u32,
    pub used: u32,
    pub remaining: u32,
    pub reset: u64,
    #[serde(default)]
    pub resource: Option<String>,
}

/// Rate limit resources.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub struct RateLimitResources {
    #[serde(default)]
    pub code_search: Option<RateLimitCore>,
    pub core: RateLimitCore,
    #[serde(default)]
    pub graphql: Option<RateLimitCore>,
    #[serde(default)]
    pub integration_manifest: Option<RateLimitCore>,
    #[serde(default)]
    pub search: Option<RateLimitCore>,
}

/// Response from the rate_limit endpoint.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub struct RateLimitResponse {
    pub resources: RateLimitResources,
    pub rate: RateLimitCore,
}

/// The type of a repository contents entry.
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum RepositoryContentsType {
    File,
    Dir,
}

/// A file or directory entry in a repository.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub struct RepositoryContents {
    pub name: String,
    pub path: String,
    pub sha: String,
    pub size: u64,
    pub html_url: String,
    pub download_url: Option<String>,
    #[serde(rename = "type")]
    pub r#type: RepositoryContentsType,
}
