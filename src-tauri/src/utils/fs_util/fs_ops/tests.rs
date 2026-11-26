#![cfg(test)]

pub mod copy_or_link_tests {
    use std::fs;
    use std::path::PathBuf;

    use tempfile::TempDir;

    use crate::utils::fs_util::{CopyMethod, copy_or_link};

    fn setup() -> (TempDir, PathBuf, PathBuf) {
        let tmp_dir = TempDir::new().unwrap();
        let src = tmp_dir.path().join("src.txt");
        let dst = tmp_dir.path().join("dst.txt");
        fs::write(&src, "content").unwrap();
        (tmp_dir, src, dst)
    }

    #[test]
    fn test_copy() {
        let (_tmp_dir, src, dst) = setup();
        copy_or_link(&src, &dst, CopyMethod::Copy).unwrap();
        assert_eq!(fs::read_to_string(&dst).unwrap(), "content");
        assert!(!fs::symlink_metadata(&dst).unwrap().file_type().is_symlink());
    }

    #[test]
    fn test_copy_replaces_existing_destination() {
        let (_tmp_dir, src, dst) = setup();
        fs::write(&dst, "old").unwrap();
        copy_or_link(&src, &dst, CopyMethod::Copy).unwrap();
        assert_eq!(fs::read_to_string(&dst).unwrap(), "content");
    }

    #[test]
    fn test_hardlink() {
        let (_tmp_dir, src, dst) = setup();
        copy_or_link(&src, &dst, CopyMethod::Hardlink).unwrap();
        assert_eq!(fs::read_to_string(&dst).unwrap(), "content");
        #[cfg(unix)]
        {
            use std::os::unix::fs::MetadataExt;
            assert_eq!(
                fs::metadata(&src).unwrap().ino(),
                fs::metadata(&dst).unwrap().ino(),
                "dst should be a hardlink to src (same inode)"
            );
        }
    }

    #[cfg(unix)]
    #[test]
    fn test_symlink() {
        let (_tmp_dir, src, dst) = setup();
        copy_or_link(&src, &dst, CopyMethod::Symlink).unwrap();
        assert!(fs::symlink_metadata(&dst).unwrap().file_type().is_symlink());
        assert_eq!(fs::read_to_string(&dst).unwrap(), "content");
    }
}

pub mod copy_dir_all_with_progress_tests {
    use clone_macro::clone;
    use std::fs;
    use tokio::sync::mpsc;

    use crate::utils::fs_util::{CopyDirProgress, CopyMethod, copy_dir_all_with_progress};

    #[tokio::test]
    async fn test_copy_dir_all_with_progress() {
        use tempfile::TempDir;

        let tmp_dir = TempDir::new().unwrap();
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
