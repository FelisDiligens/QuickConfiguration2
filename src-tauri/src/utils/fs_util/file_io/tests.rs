#![cfg(test)]

pub mod write_atomic_tests {
    use std::fs;

    use tempfile::TempDir;

    use crate::utils::fs_util::write_atomic;

    #[test]
    fn test_write_atomic_creates_file() {
        let tmp_dir = TempDir::new().unwrap();
        let path = tmp_dir.path().join("file.txt");

        write_atomic(&path, "hello").unwrap();

        assert_eq!(fs::read_to_string(&path).unwrap(), "hello");
        assert!(
            !tmp_dir.path().join("file.txt.tmp").exists(),
            "Temporary file should not be left behind"
        );
    }

    #[test]
    fn test_write_atomic_overwrites_existing_file() {
        let tmp_dir = TempDir::new().unwrap();
        let path = tmp_dir.path().join("file.txt");
        fs::write(&path, "old content").unwrap();

        write_atomic(&path, "new content").unwrap();

        assert_eq!(fs::read_to_string(&path).unwrap(), "new content");
        assert!(
            !tmp_dir.path().join("file.txt.tmp").exists(),
            "Temporary file should not be left behind"
        );
    }
}
