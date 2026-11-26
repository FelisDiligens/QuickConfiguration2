#![cfg(test)]

use std::fs;
use std::path::PathBuf;

use tempfile::TempDir;

use crate::utils::fs_util::{
    count_files_recursively, is_empty, list_directories, list_entries, list_entries_recursively,
    list_files, list_files_recursively, list_files_with_ext, list_files_with_static_exts,
};

/// Creates this directory tree and returns the temp dir guard and the root path:
/// ```text
/// root/
/// ├── file1.txt
/// ├── file2.ba2
/// └── sub/
///     ├── file3.TXT
///     └── nested/
///         └── file4.json
/// ```
fn setup_tree() -> (TempDir, PathBuf) {
    let tmp_dir = TempDir::new().unwrap();
    let root = tmp_dir.path().join("root");
    fs::create_dir_all(root.join("sub").join("nested")).unwrap();
    fs::write(root.join("file1.txt"), "1").unwrap();
    fs::write(root.join("file2.ba2"), "2").unwrap();
    fs::write(root.join("sub").join("file3.TXT"), "3").unwrap();
    fs::write(root.join("sub").join("nested").join("file4.json"), "4").unwrap();
    (tmp_dir, root)
}

fn sorted(paths: impl IntoIterator<Item = PathBuf>) -> Vec<PathBuf> {
    let mut paths: Vec<PathBuf> = paths.into_iter().collect();
    paths.sort();
    paths
}

pub mod is_empty_tests {
    use super::*;

    #[test]
    fn test_empty_directory() {
        let tmp_dir = TempDir::new().unwrap();
        assert!(is_empty(tmp_dir.path()).unwrap());
    }

    #[test]
    fn test_non_empty_directory() {
        let (_tmp_dir, root) = setup_tree();
        assert!(!is_empty(&root).unwrap());
    }
}

pub mod list_entries_tests {
    use super::*;

    #[test]
    fn test_lists_all_direct_entries() {
        let (_tmp_dir, root) = setup_tree();
        let entries = sorted(list_entries(&root).unwrap());
        assert_eq!(
            entries,
            sorted([
                root.join("file1.txt"),
                root.join("file2.ba2"),
                root.join("sub"),
            ])
        );
    }

    #[test]
    fn test_nonexistent_path_errors() {
        let tmp_dir = TempDir::new().unwrap();
        assert!(list_entries(tmp_dir.path().join("missing")).is_err());
    }

    #[test]
    fn test_list_directories_only_returns_dirs() {
        let (_tmp_dir, root) = setup_tree();
        let dirs = sorted(list_directories(&root).unwrap());
        assert_eq!(dirs, vec![root.join("sub")]);
    }

    #[test]
    fn test_list_files_only_returns_files() {
        let (_tmp_dir, root) = setup_tree();
        let files = sorted(list_files(&root).unwrap());
        assert_eq!(
            files,
            sorted([root.join("file1.txt"), root.join("file2.ba2")])
        );
    }
}

pub mod list_recursively_tests {
    use super::*;

    #[test]
    fn test_list_entries_recursively_returns_everything() {
        let (_tmp_dir, root) = setup_tree();
        let entries = sorted(list_entries_recursively(&root, 10).unwrap());
        assert_eq!(
            entries,
            sorted([
                root.join("file1.txt"),
                root.join("file2.ba2"),
                root.join("sub"),
                root.join("sub").join("file3.TXT"),
                root.join("sub").join("nested"),
                root.join("sub").join("nested").join("file4.json"),
            ])
        );
    }

    #[test]
    fn test_list_entries_recursively_respects_max_depth() {
        let (_tmp_dir, root) = setup_tree();
        assert_eq!(list_entries_recursively(&root, -1).unwrap().len(), 0);
        assert_eq!(list_entries_recursively(&root, 0).unwrap().len(), 3);
        assert_eq!(list_entries_recursively(&root, 1).unwrap().len(), 5);
        assert_eq!(list_entries_recursively(&root, 2).unwrap().len(), 6);
    }

    #[test]
    fn test_list_files_recursively_returns_only_files() {
        let (_tmp_dir, root) = setup_tree();
        let files = sorted(list_files_recursively(&root, i32::MAX).unwrap());
        assert_eq!(
            files,
            sorted([
                root.join("file1.txt"),
                root.join("file2.ba2"),
                root.join("sub").join("file3.TXT"),
                root.join("sub").join("nested").join("file4.json"),
            ])
        );
    }

    #[test]
    fn test_list_files_recursively_respects_max_depth() {
        let (_tmp_dir, root) = setup_tree();
        assert_eq!(list_files_recursively(&root, -1).unwrap().len(), 0);
        assert_eq!(list_files_recursively(&root, 0).unwrap().len(), 2);
        assert_eq!(list_files_recursively(&root, 1).unwrap().len(), 3);
        assert_eq!(list_files_recursively(&root, 2).unwrap().len(), 4);
    }
}

pub mod list_files_with_ext_tests {
    use super::*;

    #[test]
    fn test_list_files_with_ext() {
        let (_tmp_dir, root) = setup_tree();
        let files = sorted(list_files_with_ext(&root, "ba2").unwrap());
        assert_eq!(files, vec![root.join("file2.ba2")]);
    }

    #[test]
    fn test_list_files_with_ext_is_case_insensitive() {
        let (_tmp_dir, root) = setup_tree();
        let files = sorted(list_files_with_ext(root.join("sub"), "txt").unwrap());
        assert_eq!(files, vec![root.join("sub").join("file3.TXT")]);
    }

    #[test]
    fn test_list_files_with_ext_is_not_recursive() {
        let (_tmp_dir, root) = setup_tree();
        let files = sorted(list_files_with_ext(&root, "json").unwrap());
        assert!(files.is_empty());
    }

    #[test]
    fn test_list_files_with_static_exts() {
        let (_tmp_dir, root) = setup_tree();
        let files = sorted(list_files_with_static_exts(&root, &["txt", "ba2"]).unwrap());
        assert_eq!(
            files,
            sorted([root.join("file1.txt"), root.join("file2.ba2")])
        );
    }
}

pub mod count_files_recursively_tests {
    use super::*;

    #[test]
    fn test_counts_all_files_in_tree() {
        let (_tmp_dir, root) = setup_tree();
        assert_eq!(count_files_recursively(&root).unwrap(), 4);
    }

    #[test]
    fn test_empty_directory_counts_zero() {
        let tmp_dir = TempDir::new().unwrap();
        assert_eq!(count_files_recursively(tmp_dir.path()).unwrap(), 0);
    }
}
