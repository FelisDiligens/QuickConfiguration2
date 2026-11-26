#![cfg(test)]

pub mod files_equal_tests {
    use std::{
        fs,
        io::{Seek, SeekFrom, Write},
        path::PathBuf,
    };

    use tempfile::TempDir;

    use crate::utils::fs_util::{self, files_equal};

    #[test]
    fn test_files_equal_are_identical() {
        let result = files_equal(
            "tests/fixtures/general_none_sounds.ba2",
            "tests/fixtures/general_none_sounds.ba2",
        );
        assert!(result.is_ok(), "{}", result.unwrap_err());
        assert_eq!(result.unwrap(), true);
    }

    #[test]
    fn test_files_equal_are_identical_small_files() {
        let result = files_equal("tests/fixtures/test.txt", "tests/fixtures/test.txt");
        assert!(result.is_ok(), "{}", result.unwrap_err());
        assert_eq!(result.unwrap(), true);
    }

    #[test]
    fn test_files_equal_are_different_size() {
        let result = files_equal(
            "tests/fixtures/general_none_sounds.ba2",
            "tests/fixtures/general_default.ba2",
        );
        assert!(result.is_ok(), "{}", result.unwrap_err());
        assert_eq!(result.unwrap(), false);
    }

    fn setup_file(offset: SeekFrom) -> (TempDir, PathBuf) {
        let tmp_dir = TempDir::new().unwrap();
        let modified_path = tmp_dir.path().join("modified.tmp");

        fs::copy("tests/fixtures/general_none_sounds.ba2", &modified_path).unwrap();
        let mut modified_file = fs::OpenOptions::new()
            .write(true)
            .open(&modified_path)
            .unwrap();
        modified_file.seek(offset).unwrap();
        modified_file.write(&[0xff, 0xff, 0xff, 0xff]).unwrap();

        (tmp_dir, modified_path)
    }

    #[test]
    fn test_files_equal_are_same_size_but_different_in_the_middle() {
        let (_tmp_dir, modified_path) = setup_file(SeekFrom::Start(67758));
        let result = files_equal("tests/fixtures/general_none_sounds.ba2", modified_path);
        assert!(result.is_ok(), "{}", result.unwrap_err());
        assert_eq!(result.unwrap(), false);
    }

    #[test]
    fn test_files_equal_are_same_size_but_different_at_the_end() {
        let (_tmp_dir, modified_path) = setup_file(SeekFrom::End(-4));
        let result = files_equal("tests/fixtures/general_none_sounds.ba2", modified_path);
        assert!(result.is_ok(), "{}", result.unwrap_err());
        assert_eq!(result.unwrap(), false);
    }

    #[test]
    fn test_files_equal_are_same_size_but_different_small_files() {
        let tmp_dir = TempDir::new().unwrap();
        let test_file_a = tmp_dir.path().join("a.tmp");
        let test_file_b = tmp_dir.path().join("b.tmp");
        fs_util::write_to_file(&test_file_a, "a".repeat(64)).unwrap();
        fs_util::write_to_file(&test_file_b, "b".repeat(64)).unwrap();

        let result = files_equal(test_file_a, test_file_b);
        assert!(result.is_ok(), "{}", result.unwrap_err());
        assert_eq!(result.unwrap(), false);
    }
}
