#![cfg(test)]

use std::fs;

use super::*;

use tempdir::TempDir;

#[test]
fn test_extract_archive() {
    let tmp_dir = TempDir::new("unittest").unwrap();
    let zip_file = Path::new("tests/fixtures/test.zip");
    let extracted_file = tmp_dir.path().join("test.txt");

    assert!(!extracted_file.exists());
    extract_archive(zip_file, tmp_dir.path()).unwrap();
    assert!(extracted_file.is_file());
    assert_eq!(fs::read_to_string(extracted_file).unwrap(), "test");
}
