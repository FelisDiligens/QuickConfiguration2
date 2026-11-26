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

pub mod is_path_valid_tests {
    use crate::utils::fs_util::is_path_valid;

    #[test]
    fn test_empty_path() {
        assert!(!is_path_valid(""), "Empty path should be invalid");
    }

    #[test]
    fn test_valid_paths() {
        assert!(is_path_valid("folder"));
        assert!(is_path_valid("folder/sub_folder/file.txt"));
        assert!(is_path_valid("."));
        assert!(is_path_valid(".."));
        assert!(is_path_valid("folder/../other"));
    }

    #[cfg(target_os = "windows")]
    #[test]
    fn test_valid_windows_paths() {
        assert!(is_path_valid(r"C:\Program Files\Fallout 76"));
        assert!(is_path_valid(r"C:\Games\My Mods\_foo (76)\Data"));
        assert!(is_path_valid(r"\\server\share\folder"));
        assert!(is_path_valid(r"\\?\C:\Users\test\Mods"));
        assert!(is_path_valid(r"C:"));
    }

    #[cfg(target_os = "windows")]
    #[test]
    fn test_invalid_windows_paths() {
        assert!(
            !is_path_valid(r"C:\Games\Fallout?76"),
            "? character should make path invalid"
        );
        assert!(
            !is_path_valid(r"C:\Games\Fallout*76"),
            "* character should make path invalid"
        );
        assert!(
            !is_path_valid(r"C:\Games\Fallout<76>"),
            "< and > characters should make path invalid"
        );
        assert!(
            !is_path_valid(r"C:\Games\Fallout|76"),
            "| character should make path invalid"
        );
        assert!(
            !is_path_valid(r"C:\Games\Fallout."),
            "Trailing dot should make path invalid"
        );
        assert!(
            !is_path_valid(r"C:\Games\CON"),
            "Reserved name as component should make path invalid"
        );
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn test_valid_unix_paths() {
        assert!(is_path_valid(
            "/home/user/.steam/steamapps/common/Fallout 76"
        ));
        assert!(is_path_valid("/mnt/games/My_Mods"));
    }

    #[test]
    fn test_control_characters() {
        assert!(
            !is_path_valid("folder/\x00name"),
            "Null character should make path invalid"
        );
        assert!(
            !is_path_valid("folder/\x1Fname"),
            "Control character 31 should make path invalid"
        );
    }
}

pub mod join_normalized_tests {
    use std::path::{MAIN_SEPARATOR, Path};

    use crate::utils::fs_util::join_normalized;

    #[test]
    fn test_joins_and_normalizes_relative_path() {
        let result = join_normalized(Path::new("root"), "sub/file.txt").unwrap();
        assert!(result.is_absolute());
        assert_eq!(
            result,
            std::path::absolute(Path::new("root").join("sub").join("file.txt")).unwrap()
        );
    }

    #[test]
    fn test_converts_foreign_path_separators() {
        let result = join_normalized(Path::new("root"), "sub\\file.txt").unwrap();
        let expected = format!("root{MAIN_SEPARATOR}sub{MAIN_SEPARATOR}file.txt");
        assert!(
            result.ends_with(&expected),
            "expected {result:?} to end with {expected:?}"
        );
    }

    #[test]
    fn test_normalizes_dot_components() {
        let result = join_normalized(Path::new("root"), "./sub/../file.txt").unwrap();
        let expected = format!("root{MAIN_SEPARATOR}file.txt");
        assert!(
            result.ends_with(&expected),
            "expected {result:?} to end with {expected:?}"
        );
    }
}
