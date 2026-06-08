#![cfg(test)]

pub mod is_filename_valid_tests {
    use crate::utils::fs_util::is_filename_valid;

    #[test]
    fn test_empty_filename() {
        assert!(!is_filename_valid(""), "Empty filename should be invalid");
    }

    #[test]
    fn test_control_characters() {
        // Test ASCII control characters (0-31)
        assert!(
            !is_filename_valid("\x00test"),
            "Null character should make filename invalid"
        );
        assert!(
            !is_filename_valid("\x01test"),
            "Control character 1 should make filename invalid"
        );
        assert!(
            !is_filename_valid("\x1Ftest"),
            "Control character 31 should make filename invalid"
        );
    }

    #[test]
    fn test_valid_filenames() {
        // Basic valid filenames
        assert!(is_filename_valid("file.txt"));
        assert!(is_filename_valid("File_Name.v2"));
        assert!(is_filename_valid("123_test_456"));
        assert!(is_filename_valid("a")); // Single character
        assert!(is_filename_valid(
            "very_long_filename_with_many_characters.txt"
        ));
    }

    #[cfg(target_os = "windows")]
    #[test]
    fn test_windows_invalid_chars() {
        // Test Windows-specific invalid characters
        assert!(
            !is_filename_valid("file<name.txt"),
            "< character should be invalid"
        );
        assert!(
            !is_filename_valid("file>name.txt"),
            "> character should be invalid"
        );
        assert!(
            !is_filename_valid("file:name.txt"),
            ": character should be invalid"
        );
        assert!(
            !is_filename_valid("file\"name.txt"),
            "\" character should be invalid"
        );
        assert!(
            !is_filename_valid("file|name.txt"),
            "| character should be invalid"
        );
        assert!(
            !is_filename_valid("file?name.txt"),
            "? character should be invalid"
        );
        assert!(
            !is_filename_valid("file*name.txt"),
            "* character should be invalid"
        );
    }

    #[cfg(target_os = "windows")]
    #[test]
    fn test_windows_reserved_names() {
        // Test Windows reserved names (case insensitive)
        assert!(!is_filename_valid("CON"), "CON should be invalid");
        assert!(
            !is_filename_valid("con"),
            "con should be invalid (case insensitive)"
        );
        assert!(!is_filename_valid("PRN"), "PRN should be invalid");
        assert!(
            !is_filename_valid("Aux"),
            "Aux should be invalid (case insensitive)"
        );
        assert!(!is_filename_valid("COM1"), "COM1 should be invalid");
        assert!(
            !is_filename_valid("com9"),
            "com9 should be invalid (case insensitive)"
        );
        assert!(!is_filename_valid("LPT1"), "LPT1 should be invalid");
        assert!(
            !is_filename_valid("lpt8"),
            "lpt8 should be invalid (case insensitive)"
        );
    }

    #[cfg(target_os = "windows")]
    #[test]
    fn test_windows_trailing_chars() {
        // Test Windows trailing space and dot rules
        assert!(
            !is_filename_valid("file "),
            "Trailing space should be invalid"
        );
        assert!(
            !is_filename_valid("file."),
            "Trailing dot should be invalid"
        );
        assert!(
            is_filename_valid("file.txt"),
            "Normal extension should be valid"
        );
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn test_unix_path_separator() {
        // Test Unix path separator rules
        assert!(
            !is_filename_valid("file/name.txt"),
            "/ character should be invalid"
        );
        assert!(
            !is_filename_valid("path/to/file"),
            "Multiple / characters should be invalid"
        );
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn test_unix_current_parent_dirs() {
        // Test Unix current and parent directory names
        assert!(!is_filename_valid("."), ". should be invalid");
        assert!(!is_filename_valid(".."), ".. should be invalid");
    }

    #[test]
    fn test_unicode_characters() {
        // Test that Unicode characters work (as long as they're not control chars)
        assert!(is_filename_valid("файл.txt")); // Cyrillic
        assert!(is_filename_valid("文件.txt")); // Chinese
        assert!(is_filename_valid("ファイル.txt")); // Japanese
        assert!(is_filename_valid("файл_тест_123.txt"));
    }

    #[test]
    fn test_special_characters() {
        // Test various special characters that should be valid on most systems
        assert!(is_filename_valid("file-name.txt"));
        assert!(is_filename_valid("file_name.txt"));
        assert!(is_filename_valid("file.name.txt"));
        assert!(is_filename_valid("file$name.txt")); // $ is valid on Unix
        assert!(is_filename_valid("file@name.txt")); // @ is valid on Unix
    }

    #[cfg(target_os = "windows")]
    #[test]
    fn test_windows_valid_special_chars() {
        // Test characters that are valid on Windows but might be problematic
        assert!(is_filename_valid("file$name.txt")); // $ is valid on Windows
        assert!(is_filename_valid("file@name.txt")); // @ is valid on Windows
        assert!(is_filename_valid("file#name.txt")); // # is valid on Windows
    }
}

pub mod copy_dir_all_with_progress_tests {
    use clone_macro::clone;
    use std::fs;
    use tokio::sync::mpsc;

    use crate::utils::fs_util::{CopyDirProgress, CopyMethod, copy_dir_all_with_progress};

    #[tokio::test]
    async fn test_copy_dir_all_with_progress() {
        use tempdir::TempDir;

        let tmp_dir = TempDir::new("unittest").unwrap();
        let src_dir = tmp_dir.path().join("source");
        let dst_dir = tmp_dir.path().join("destination");

        // Create source directory structure
        fs::create_dir_all(&src_dir).unwrap();
        fs::write(src_dir.join("file1.txt"), "content1").unwrap();
        fs::write(src_dir.join("file2.txt"), "content2").unwrap();

        // Create a subdirectory with files
        let subdir = src_dir.join("subdir");
        fs::create_dir_all(&subdir).unwrap();
        fs::write(subdir.join("file3.txt"), "content3").unwrap();

        // Create channel for progress updates
        let (tx, mut rx) = mpsc::channel(10);

        // Copy with progress
        let result = tokio::task::spawn_blocking(clone!([src_dir, dst_dir], move || {
            copy_dir_all_with_progress(&src_dir, &dst_dir, CopyMethod::Copy, tx)
        }))
        .await;
        assert!(result.is_ok());

        // Verify files were copied
        assert!(dst_dir.join("file1.txt").exists());
        assert!(dst_dir.join("file2.txt").exists());
        assert!(dst_dir.join("subdir").join("file3.txt").exists());

        // Verify progress updates were sent
        let mut progress_updates = Vec::new();
        while let Some(progress) = rx.recv().await {
            progress_updates.push(progress);
        }

        // Should have received 5 progress updates (preparing, 3 files, finished)
        assert_eq!(progress_updates.len(), 5);

        // Verify the progress updates are correct
        // First should be Preparing
        match &progress_updates[0] {
            CopyDirProgress::Preparing => {}
            _ => panic!("First progress update should be Preparing"),
        }

        // Next 3 should be Copying updates (order may vary due to directory traversal)
        let copying_updates: Vec<_> = progress_updates
            .iter()
            .skip(1)
            .take(3)
            .filter_map(|p| match p {
                CopyDirProgress::Copying {
                    file_name,
                    copied,
                    total,
                } => Some((file_name.clone(), *copied, *total)),
                _ => None,
            })
            .collect();

        assert_eq!(copying_updates.len(), 3);

        let mut file_names: Vec<String> = copying_updates
            .iter()
            .map(|(name, _, _)| name.clone())
            .collect();
        file_names.sort();
        assert_eq!(file_names, vec!["file1.txt", "file2.txt", "file3.txt"]);

        // Verify all progress updates have correct totals and incrementing counts
        assert!(copying_updates.iter().all(|(_, _, total)| *total == 3));

        let mut copied_counts: Vec<_> = copying_updates
            .iter()
            .map(|(_, copied, _)| *copied)
            .collect();
        copied_counts.sort();
        assert_eq!(copied_counts, vec![0, 1, 2]);

        // Last should be Finished
        match &progress_updates[4] {
            CopyDirProgress::Finished { copied } => {
                assert_eq!(*copied, 3);
            }
            _ => panic!("Last progress update should be Finished"),
        }
    }
}
