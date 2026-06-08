#![cfg(test)]

use crate::utils::fs_util;

use super::*;

use tempdir::TempDir;
use wiremock::{
    Mock, MockServer, ResponseTemplate,
    matchers::{method, path},
};

#[test]
fn test_create_thumbnail_png() {
    let tmp_dir = TempDir::new("unittest").unwrap();
    let orig_file = Path::new("tests/fixtures/pixel.png").to_path_buf();
    assert!(orig_file.is_file());

    let thumb_file = tmp_dir.path().join("pixel-thumb.png");
    assert!(!thumb_file.exists());
    thumbnails::create_thumbnail(&orig_file, &thumb_file).unwrap();
    assert!(thumb_file.is_file());
}

#[test]
fn test_create_thumbnail_jpg() {
    let tmp_dir = TempDir::new("unittest").unwrap();
    let orig_file = Path::new("tests/fixtures/pixel.jpg").to_path_buf();
    assert!(orig_file.is_file());

    let thumb_file = tmp_dir.path().join("pixel-thumb.jpg");
    assert!(!thumb_file.exists());
    thumbnails::create_thumbnail(&orig_file, &thumb_file).unwrap();
    assert!(thumb_file.is_file());
}

#[tokio::test]
async fn test_create_thumbnail_from_url() {
    let mock_server = MockServer::start().await;
    Mock::given(method("GET"))
        .and(path("/pixel.jpg"))
        .respond_with(
            ResponseTemplate::new(200)
                .set_body_bytes(fs_util::read_to_bytes("tests/fixtures/pixel.jpg").unwrap()),
        )
        .mount(&mock_server)
        .await;

    let tmp_dir = TempDir::new("unittest").unwrap();

    let thumb_file = tmp_dir.path().join("thumb.jpg");
    assert!(!thumb_file.exists());
    thumbnails::create_thumbnail_from_url(format!("{}/pixel.jpg", &mock_server.uri()), &thumb_file)
        .await
        .unwrap();
    assert!(thumb_file.is_file());
}

#[test]
fn test_create_thumbnail_safe() {
    let tmp_dir = TempDir::new("unittest").unwrap();
    let orig_file = Path::new("tests/fixtures/pixel.png").to_path_buf();
    assert!(orig_file.is_file());

    let thumb_dir = tmp_dir.path().join("thumbnails");
    let thumb_file = thumb_dir.join("pixel.png");
    assert!(!thumb_dir.exists());
    assert!(!thumb_file.exists());

    thumbnails::create_thumbnail_safe(&orig_file, Some(&thumb_dir), None);

    assert!(thumb_dir.is_dir());
    assert!(thumb_file.is_file());
}

#[test]
fn test_create_thumbnail_safe_with_suffix() {
    let tmp_dir = TempDir::new("unittest").unwrap();
    let orig_file = Path::new("tests/fixtures/pixel.png").to_path_buf();
    assert!(orig_file.is_file());

    let thumb_dir = tmp_dir.path().join("thumbnails");
    let thumb_file = thumb_dir.join("pixel-thumb.png");
    assert!(!thumb_dir.exists());
    assert!(!thumb_file.exists());

    thumbnails::create_thumbnail_safe(&orig_file, Some(&thumb_dir), Some("-thumb"));

    assert!(thumb_dir.is_dir());
    assert!(thumb_file.is_file());
}
