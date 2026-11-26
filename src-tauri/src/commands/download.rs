use camino::Utf8PathBuf;
use serde::{Deserialize, Serialize};
use specta::Type;
use tap::TapFallible;
use tauri::{AppHandle, Emitter};
use tauri_specta::Event;
use url::Url;

use crate::commands::errors::CommandResult;
use crate::utils;

#[derive(Serialize, Deserialize, Debug, Clone, Type, Event)]
#[serde(rename_all = "camelCase")]
pub struct DownloadProgress {
    /// Number of downloaded bytes formatted as a string, because the numbers might get too large for Json/IPC.
    pub downloaded_bytes: String,
    /// Size of downloaded file in number of bytes formatted as a string, because the numbers might get too large for Json/IPC.
    pub total_bytes: String,
    pub percent: f32,
}
const DOWNLOAD_PROGRESS_EVENT: &str = "download-progress";

impl From<utils::download::DownloadProgress> for DownloadProgress {
    fn from(progress: utils::download::DownloadProgress) -> Self {
        DownloadProgress {
            downloaded_bytes: progress.downloaded_bytes.to_string(),
            total_bytes: progress.total_bytes.to_string(),
            percent: progress.downloaded_bytes as f32 / progress.total_bytes as f32,
        }
    }
}

#[tauri::command]
#[specta::specta]
#[function_name::named]
pub async fn download_with_progress(
    download_url: String,
    download_folder: String,
    app: AppHandle,
) -> CommandResult<String> {
    log::trace!("Called command {}", function_name!());

    // Get the download folder path and create it:
    let download_folder: Utf8PathBuf = download_folder.into();
    tokio::fs::create_dir_all(&download_folder).await?;

    // Parse the download URL:
    let download_url = Url::parse(&download_url)
        .tap_err(|e| log::error!("Couldn't parse url {download_url}: {e}"))?;

    // Download file:
    log::trace!("Downloading from {download_url} to {download_folder}");
    let file_path = utils::download::download_file(
        reqwest::Client::new().get(download_url),
        &download_folder,
        None,
        &|progress| {
            let _ = app
                .emit(DOWNLOAD_PROGRESS_EVENT, DownloadProgress::from(progress))
                .tap_err(|e| log::error!("Couldn't send progress event: {e}"));
        },
    )
    .await
    .tap_err(|e| log::error!("Couldn't download file: {e}"))?;
    Ok(file_path.to_string_lossy().to_string())
}
