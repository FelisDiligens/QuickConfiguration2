use camino::Utf8PathBuf;
use tokio::io::AsyncWriteExt;

use crate::{
    features::github::{GitHubAPI, RepositoryContentsType},
    utils::paths::get_translation_folder_path,
};

pub const GITHUB_REPO_OWNER: &str = "FelisDiligens";
pub const GITHUB_REPO_NAME: &str = "QuickConfiguration2-Extras";
pub const GITHUB_REPO_BRANCH: &str = "main";
pub const GITHUB_REPO_RELPATH: &str = "translations";

/// Check if there are new commits since the last timestamp
pub async fn check_for_updates(
    last_updated: Option<chrono::DateTime<chrono::Utc>>,
) -> anyhow::Result<bool> {
    let Some(last_updated) = last_updated else {
        return Ok(true);
    };
    let last_commit_date = GitHubAPI::new()
        .get_last_commit_date_at_path(GITHUB_REPO_OWNER, GITHUB_REPO_NAME, GITHUB_REPO_RELPATH)
        .await?;
    let Some(last_commit_date) = last_commit_date else {
        return Ok(false);
    };
    Ok(last_commit_date > last_updated)
}

fn get_raw_content_url<S: AsRef<str>>(owner: &str, repo: &str, branch: &str, path: S) -> String {
    let path = path.as_ref();
    format!("https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}")
}

/// Download all translation files from the GitHub repo.
/// Returns the list of downloaded file names.
pub async fn download_translations() -> anyhow::Result<Vec<String>> {
    let folder_path = get_translation_folder_path().ok_or(anyhow::anyhow!(
        "Translation folder path could not be determined."
    ))?;
    let contents = GitHubAPI::new()
        .get_repository_contents(GITHUB_REPO_OWNER, GITHUB_REPO_NAME, GITHUB_REPO_RELPATH)
        .await?;

    // Create translations folder:
    tokio::fs::create_dir_all(&folder_path).await?;

    let mut list = Vec::with_capacity(contents.len());
    for entry in contents.iter() {
        // Filter out directories:
        if entry.r#type != RepositoryContentsType::File {
            continue;
        }
        // Filter out all files that don't have the zip extension:
        let path = Utf8PathBuf::from(&entry.name);
        let Some(file_extension) = path.extension() else {
            continue;
        };
        if file_extension != "json" {
            continue;
        }

        // Get the download URL:
        let download_url =
            entry
                .download_url
                .as_ref()
                .map(|s| s.to_owned())
                .unwrap_or(get_raw_content_url(
                    GITHUB_REPO_OWNER,
                    GITHUB_REPO_NAME,
                    GITHUB_REPO_BRANCH,
                    &entry.path,
                ));
        log::trace!("Downloading {} from {}", entry.name, download_url);

        // Download and save the file:
        let resp = reqwest::get(download_url).await?;
        let mut file = tokio::fs::File::create(folder_path.join(&entry.name)).await?;
        let content = resp.bytes().await?;
        file.write_all(&content).await?;
        list.push(entry.name.clone());
    }
    Ok(list)
}
