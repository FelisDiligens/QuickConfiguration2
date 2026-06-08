#![cfg(test)]

use std::{fs, path::Path};

use super::*;

use tempdir::TempDir;

#[test]
fn test_get_game_screenshots() {
    let tmp_dir = TempDir::new("unittest").unwrap();
    let jpg_file = Path::new("tests/fixtures/pixel.jpg");
    fs::copy(jpg_file, tmp_dir.path().join("pixel.jpg")).unwrap();

    let thumbnails_dir = tmp_dir.path().join("thumbnails");
    let thumbnail_file = tmp_dir.path().join("thumbnails").join("pixel.jpg");
    assert!(!thumbnails_dir.exists());
    assert!(!thumbnail_file.exists());
    let screenshots =
        screenshots::get_game_screenshots(tmp_dir.path(), Some(thumbnails_dir.as_path())).unwrap();
    assert!(screenshots.len() == 1);
    assert!(thumbnails_dir.is_dir());
    assert!(thumbnail_file.is_file());
}

#[test]
fn test_get_game_photos() {
    let tmp_dir = TempDir::new("unittest").unwrap();
    let photos_path = tmp_dir.path().join("Photos").join("subdir");
    fs::create_dir_all(&photos_path).unwrap();

    let jpg_file = Path::new("tests/fixtures/pixel.jpg");
    fs::copy(jpg_file, photos_path.join("pixel.jpg")).unwrap();

    let thumbnail_file = photos_path.join("pixel-thumbnail.jpg");
    assert!(!thumbnail_file.exists());
    let screenshots = screenshots::get_game_photos(tmp_dir.path()).unwrap();
    assert!(screenshots.len() == 1);
    assert!(thumbnail_file.is_file());
}
