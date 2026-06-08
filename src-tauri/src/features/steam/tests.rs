#![cfg(test)]

use std::{fs, path::Path};

use super::*;

use tempdir::TempDir;

#[test]
fn test_get_steam_screenshots() {
    let tmp_dir = TempDir::new("unittest").unwrap();
    let jpg_file = Path::new("tests/fixtures/pixel.jpg");
    fs::copy(jpg_file, tmp_dir.path().join("pixel.jpg").as_path()).unwrap();

    let thumbnails_dir = tmp_dir.path().join("thumbnails");
    let thumbnail_file = tmp_dir.path().join("thumbnails").join("pixel.jpg");
    assert!(!thumbnails_dir.exists());
    assert!(!thumbnail_file.exists());
    let screenshots = screenshots::get_steam_screenshots(tmp_dir.path()).unwrap();
    assert!(screenshots.len() == 1);
    assert!(thumbnails_dir.is_dir());
    assert!(thumbnail_file.is_file());
}
