#[cfg(test)]
pub mod tests;

use std::fs::File;
use std::io::{self, Write};
use std::path::{Path, PathBuf};

use content_disposition::parse_content_disposition;
use futures_util::StreamExt;
use percent_encoding;
use reqwest::RequestBuilder;
use tokio::sync::mpsc::Sender;

#[derive(Debug)]
pub struct DownloadProgress {
    pub downloaded_bytes: u64,
    pub total_bytes: u64,
}

#[derive(thiserror::Error, Debug, strum::AsRefStr)]
pub enum DownloadError {
    #[error(transparent)]
    Io(#[from] io::Error),
    #[error(transparent)]
    Reqwest(#[from] reqwest::Error),
    #[error("Failed to send download progress over mpsc channel")]
    SendError,
    #[error("Failed to get content length")]
    ContentLengthUnknown,
    #[error("Failed to determine file name from URL or HTTP headers")]
    FileNameUnknown,
}

/// Downloads a file to the given directory path.
/// If `file_name` is provided, uses it as the file name.
/// Otherwise, tries to get the file name from the Content-Disposition header,
/// and falls back to extracting it from the download URL.
pub async fn download_file<P: AsRef<Path>>(
    request: RequestBuilder,
    path: P,
    file_name: Option<&str>,
    tx: Sender<DownloadProgress>,
) -> Result<PathBuf, DownloadError> {
    let resp = request.send().await?;
    let total_bytes = resp
        .content_length()
        .ok_or(DownloadError::ContentLengthUnknown)?;

    // Resolve the final file path based on the provided file name,
    // Content-Disposition header, or URL fallback:
    let path = if let Some(file_name) = file_name {
        path.as_ref().join(file_name)
    } else {
        let file_name = resp
            .headers()
            .get(reqwest::header::CONTENT_DISPOSITION)
            .and_then(|header| header.to_str().ok())
            .map(parse_content_disposition)
            .and_then(|cd| cd.filename_full());

        if let Some(file_name) = file_name {
            log::trace!(
                "[download_file] Got file name from Content-Disposition header: {file_name}"
            );
            path.as_ref().join(file_name)
        } else {
            let file_name = resp
                .url()
                .path_segments()
                .and_then(|mut segments| segments.next_back())
                .map(|last_segment| {
                    percent_encoding::percent_decode_str(last_segment)
                        .decode_utf8_lossy()
                        .to_string()
                })
                .ok_or(DownloadError::FileNameUnknown)?;

            log::trace!("[download_file] Got file name from URL segments: {file_name}");
            path.as_ref().join(file_name)
        }
    };

    log::trace!(
        "[download_file] Starting download from URL {} to file {:?} with size {} B",
        resp.url(),
        path,
        total_bytes
    );

    let mut downloaded_bytes = 0u64;
    let one_percent_in_bytes = total_bytes / 100;
    let mut stream = resp.bytes_stream();
    let mut file = File::create(&path)?;

    tx.send(DownloadProgress {
        downloaded_bytes: 0,
        total_bytes,
    })
    .await
    .map_err(|_| DownloadError::SendError)?;

    let mut last_emitted_downloaded_bytes = 0u64;
    while let Some(bytes) = stream.next().await {
        let bytes = bytes?;
        file.write_all(&bytes)?;
        downloaded_bytes = std::cmp::min(downloaded_bytes + (bytes.len() as u64), total_bytes);

        if (downloaded_bytes - last_emitted_downloaded_bytes) > one_percent_in_bytes {
            last_emitted_downloaded_bytes = downloaded_bytes;
            tx.send(DownloadProgress {
                downloaded_bytes,
                total_bytes,
            })
            .await
            .map_err(|_| DownloadError::SendError)?;
        }
    }

    tx.send(DownloadProgress {
        downloaded_bytes: total_bytes,
        total_bytes,
    })
    .await
    .map_err(|_| DownloadError::SendError)?;

    Ok(path)
}
