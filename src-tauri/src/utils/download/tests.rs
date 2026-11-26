#![cfg(test)]

use std::path::Path;

use reqwest::Client;
use tempfile::TempDir;
use tokio::fs;
use wiremock::matchers::method;
use wiremock::{Mock, MockServer, ResponseTemplate};

use crate::utils::test_utils;

use super::download_file;

#[tokio::test]
pub async fn test_download_file_with_given_filename() {
    test_utils::setup_stdout_logger();
    let tmp_dir = TempDir::new().unwrap();
    let mock_server = MockServer::start().await;
    let messages = std::sync::Mutex::new(Vec::new());

    let fixture_path = Path::new("tests/fixtures/test.zip");
    let fixture_data = fs::read(fixture_path).await.unwrap();
    let fixture_len = fixture_data.len() as u64;

    Mock::given(method("GET"))
        .respond_with(ResponseTemplate::new(200).set_body_bytes(fixture_data.clone()))
        .mount(&mock_server)
        .await;

    let client = Client::new();
    let url = mock_server.uri();
    let request = client.get(url);

    let expected_download_path = tmp_dir.path().join("test.zip");

    let result = download_file(request, tmp_dir.path(), Some("test.zip"), &|progress| {
        messages.lock().unwrap().push(progress)
    })
    .await;

    assert!(result.is_ok(), "{}", result.unwrap_err());
    let download_path = result.unwrap();
    assert_eq!(download_path, expected_download_path);

    let downloaded_data = fs::read(&download_path).await.unwrap();
    assert_eq!(downloaded_data, fixture_data);
    assert_eq!(downloaded_data.len() as u64, fixture_len);

    let messages = messages.into_inner().unwrap();

    let first_progress = messages.first().unwrap();
    assert_eq!(first_progress.downloaded_bytes, 0);
    assert_eq!(first_progress.total_bytes, fixture_len);

    let last_progress = messages.last().unwrap();
    assert_eq!(last_progress.downloaded_bytes, fixture_len);
    assert_eq!(last_progress.total_bytes, fixture_len);
}

#[tokio::test]
pub async fn test_download_file_with_filename_from_url() {
    test_utils::setup_stdout_logger();
    let tmp_dir = TempDir::new().unwrap();
    let mock_server = MockServer::start().await;
    let messages = std::sync::Mutex::new(Vec::new());

    let fixture_path = Path::new("tests/fixtures/test.zip");
    let fixture_data = fs::read(fixture_path).await.unwrap();
    let fixture_len = fixture_data.len() as u64;

    Mock::given(method("GET"))
        .and(wiremock::matchers::path("/test-from-url.zip"))
        .respond_with(ResponseTemplate::new(200).set_body_bytes(fixture_data.clone()))
        .mount(&mock_server)
        .await;

    let client = Client::new();
    let url = mock_server.uri() + "/test-from-url.zip";
    let request = client.get(url);

    let expected_download_path = tmp_dir.path().join("test-from-url.zip");

    let result = download_file(request, tmp_dir.path(), None, &|progress| {
        messages.lock().unwrap().push(progress)
    })
    .await;

    assert!(result.is_ok(), "{}", result.unwrap_err());
    let download_path = result.unwrap();
    assert_eq!(download_path, expected_download_path);

    let downloaded_data = fs::read(&download_path).await.unwrap();
    assert_eq!(downloaded_data, fixture_data);
    assert_eq!(downloaded_data.len() as u64, fixture_len);

    let messages = messages.into_inner().unwrap();

    let first_progress = messages.first().unwrap();
    assert_eq!(first_progress.downloaded_bytes, 0);
    assert_eq!(first_progress.total_bytes, fixture_len);

    let last_progress = messages.last().unwrap();
    assert_eq!(last_progress.downloaded_bytes, fixture_len);
    assert_eq!(last_progress.total_bytes, fixture_len);
}

#[tokio::test]
pub async fn test_download_file_with_filename_from_content_disposition() {
    test_utils::setup_stdout_logger();
    let tmp_dir = TempDir::new().unwrap();
    let mock_server = MockServer::start().await;
    let messages = std::sync::Mutex::new(Vec::new());

    let fixture_path = Path::new("tests/fixtures/test.zip");
    let fixture_data = fs::read(fixture_path).await.unwrap();
    let fixture_len = fixture_data.len() as u64;

    Mock::given(method("GET"))
        .and(wiremock::matchers::path("/test-from-url.zip"))
        .respond_with(
            ResponseTemplate::new(200)
                .set_body_bytes(fixture_data.clone())
                .insert_header(
                    "Content-Disposition",
                    "attachment; filename=\"test-from-header.zip\"",
                ),
        )
        .mount(&mock_server)
        .await;

    let client = Client::new();
    let url = mock_server.uri() + "/test-from-url.zip";
    let request = client.get(url);

    let expected_download_path = tmp_dir.path().join("test-from-header.zip");

    let result = download_file(request, tmp_dir.path(), None, &|progress| {
        messages.lock().unwrap().push(progress)
    })
    .await;

    assert!(result.is_ok(), "{}", result.unwrap_err());
    let download_path = result.unwrap();
    assert_eq!(download_path, expected_download_path);

    let downloaded_data = fs::read(&download_path).await.unwrap();
    assert_eq!(downloaded_data, fixture_data);
    assert_eq!(downloaded_data.len() as u64, fixture_len);

    let messages = messages.into_inner().unwrap();

    let first_progress = messages.first().unwrap();
    assert_eq!(first_progress.downloaded_bytes, 0);
    assert_eq!(first_progress.total_bytes, fixture_len);

    let last_progress = messages.last().unwrap();
    assert_eq!(last_progress.downloaded_bytes, fixture_len);
    assert_eq!(last_progress.total_bytes, fixture_len);
}
