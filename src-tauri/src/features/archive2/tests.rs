#![cfg(test)]

use std::fs;

use super::models::{Archive2Compression, Archive2Format};
use super::*;

use tempdir::TempDir;

#[ignore = "Can take up to 15 seconds to complete with wine"]
#[test]
fn test_extract_archive2_general() {
    let tmp_dir = TempDir::new("unittest").unwrap();
    let ba2_file = Path::new("tests/fixtures/general_default.ba2");
    let extracted_file = tmp_dir.path().join("test.txt");

    assert!(!extracted_file.exists());
    extract_archive2(ba2_file, tmp_dir.path()).unwrap();
    assert!(extracted_file.is_file());
    assert_eq!(fs::read_to_string(extracted_file).unwrap(), "test");
}

#[ignore = "Can take up to 15 seconds to complete with wine"]
#[test]
fn test_extract_archive2_dds() {
    let tmp_dir = TempDir::new("unittest").unwrap();
    let ba2_file = Path::new("tests/fixtures/dds_default.ba2");
    let extracted_file = tmp_dir.path().join("pixel.dds");

    assert!(!extracted_file.exists());
    extract_archive2(ba2_file, tmp_dir.path()).unwrap();
    assert!(extracted_file.is_file());
    assert!(
        fs_util::read_to_bytes(extracted_file)
            .unwrap()
            .starts_with("DDS".as_bytes())
    );
}

#[ignore = "Can take up to 15 seconds to complete with wine"]
#[test]
fn test_create_archive2_general() {
    let tmp_dir = TempDir::new("unittest").unwrap();
    let source_folder = tmp_dir.path().join("folder");
    fs::create_dir(&source_folder).unwrap();
    fs::copy(
        Path::new("tests/fixtures/test.txt"),
        source_folder.join("test.txt"),
    )
    .unwrap();

    let ba2_file = tmp_dir.path().join("test.ba2");
    assert!(!ba2_file.exists());
    create_archive2(
        ba2_file.as_path(),
        source_folder.as_path(),
        Archive2Format::General,
        Archive2Compression::Default,
    )
    .unwrap();
    assert!(ba2_file.is_file());
    assert!(
        fs_util::read_to_bytes(ba2_file)
            .unwrap()
            .starts_with("BTDX".as_bytes())
    );
}

#[ignore = "Can take up to 15 seconds to complete with wine"]
#[test]
fn test_create_archive2_dds() {
    let tmp_dir = TempDir::new("unittest").unwrap();
    let source_folder = tmp_dir.path().join("folder");
    fs::create_dir(&source_folder).unwrap();
    fs::copy(
        Path::new("tests/fixtures/pixel.dds"),
        source_folder.join("pixel.dds"),
    )
    .unwrap();

    let ba2_file = tmp_dir.path().join("test.ba2");
    assert!(!ba2_file.exists());
    create_archive2(
        ba2_file.as_path(),
        source_folder.as_path(),
        Archive2Format::DDS,
        Archive2Compression::Default,
    )
    .unwrap();
    assert!(ba2_file.is_file());
    assert!(
        fs_util::read_to_bytes(ba2_file)
            .unwrap()
            .starts_with("BTDX".as_bytes())
    );
}

#[test]
fn test_read_archive2_general_default() {
    let result = read_archive2("tests/fixtures/general_default.ba2").unwrap();
    assert_eq!(result.format, Archive2Format::General);
    assert_eq!(result.compression, Archive2Compression::Default);
}

#[test]
fn test_read_archive2_general_none() {
    let result = read_archive2("tests/fixtures/general_none.ba2").unwrap();
    assert_eq!(result.format, Archive2Format::General);
    assert_eq!(result.compression, Archive2Compression::None);
}

#[test]
fn test_read_archive2_dds_default() {
    let result = read_archive2("tests/fixtures/dds_default.ba2").unwrap();
    assert_eq!(result.format, Archive2Format::DDS);
    assert_eq!(result.compression, Archive2Compression::Default);
}
