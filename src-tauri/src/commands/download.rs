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
    let (tx, mut rx) = tokio::sync::mpsc::channel::<utils::download::DownloadProgress>(3);
    let handle = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            let percent = msg.downloaded_bytes as f32 / msg.total_bytes as f32 * 100.0;
            app.emit(
                DOWNLOAD_PROGRESS_EVENT,
                DownloadProgress {
                    downloaded_bytes: msg.downloaded_bytes.to_string(),
                    total_bytes: msg.total_bytes.to_string(),
                    percent: percent / 100.0,
                },
            )
            .unwrap();
        }
    });
    let file_path = utils::download::download_file(
        reqwest::Client::new().get(download_url),
        &download_folder,
        None,
        tx,
    )
    .await
    .tap_err(|e| log::error!("Couldn't download file: {e}"))?;
    handle.await?;
    Ok(file_path.to_string_lossy().to_string())
}
