#![cfg(test)]

pub use super::*;

pub mod install_tests {
    use std::{fs, path::Path};

    use tempdir::TempDir;

    use crate::features::mods::models::json::{ManagedMod, ManagedMods, ModInstallationOptions};
    use crate::utils::test_utils;

    pub use super::*;

    #[test]
    fn test_install_from_temp_folder() {
        test_utils::setup_stdout_logger();
        let tmp_dir = TempDir::new("unittest").unwrap();
        let destination_file = tmp_dir.path().join("modfolder").join("test.txt");

        // Create test fixtures in temporary folder:
        fs::create_dir(tmp_dir.path().join("_tmp")).unwrap();
        fs::copy(
            Path::new("tests/fixtures/test.txt"),
            tmp_dir.path().join("_tmp").join("test.txt").as_path(),
        )
        .unwrap();
        assert!(!destination_file.exists());

        // Install mod:
        let mut mods = ManagedMods::default();
        mods.install_from_temp_folder(
            tmp_dir.path(),
            ManagedMod {
                key: "".to_string(),
                title: "".to_string(),
                folder_name: "modfolder".to_string(),
                version: "".to_string(),
                url: "".to_string(),
                notes: "".to_string(),
                enabled: true,
                options: ModInstallationOptions {
                    root_folder: ".".to_string(),
                },
            },
            vec!["./test.txt"],
        )
        .unwrap();

        // Check if installation was successful:
        assert!(destination_file.is_file());
        assert_eq!(fs::read_to_string(destination_file).unwrap(), "test");
        assert_eq!(mods.mods.len(), 1);
        assert_eq!(mods.mods[0].folder_name, "modfolder");
    }

    #[test]
    fn test_install_from_existing_archives() {
        test_utils::setup_stdout_logger();
        let tmp_dir = TempDir::new("unittest").unwrap();
        let game_path = tmp_dir.as_ref().to_path_buf();
        let game_data_path = game_path.join("Data");
        let mods_path = game_path.join("Mods");

        // Create test files:
        fs::create_dir(&game_data_path).unwrap();
        fs::create_dir(&mods_path).unwrap();

        fs_util::write_to_file(game_data_path.join("Archive1.ba2"), "").unwrap();
        fs_util::write_to_file(game_data_path.join("Archive2.ba2"), "").unwrap();
        fs_util::write_to_file(game_data_path.join("Archive3.ba2"), "").unwrap();

        // Install mod:
        let mut mods = ManagedMods::default();
        mods.install_from_existing_archives(
            &game_path,
            &mods_path,
            ManagedMod {
                title: "Test".to_string(),
                folder_name: "modfolder".to_string(),
                enabled: true,
                ..Default::default()
            },
            &["Archive1.ba2", "Archive2.ba2"],
        )
        .unwrap();

        // Check if installation was successful:
        assert!(game_data_path.join("Archive1.ba2").is_file());
        assert!(game_data_path.join("Archive2.ba2").is_file());
        assert!(game_data_path.join("Archive3.ba2").is_file());
        assert!(mods_path.join("modfolder").join("Archive1.ba2").is_file());
        assert!(mods_path.join("modfolder").join("Archive2.ba2").is_file());
        assert!(!mods_path.join("modfolder").join("Archive3.ba2").is_file());

        assert_eq!(mods.mods.len(), 1);
        assert_eq!(mods.state.len(), 1);
        assert_eq!(mods.mods[0].enabled, true);
        assert_eq!(mods.mods[0].title, "Test");
        assert_eq!(mods.mods[0].folder_name, "modfolder");
        assert_eq!(mods.mods[0].options.root_folder, "Data");
        assert_eq!(mods.state[0].root_folder, "Data");
        assert_eq!(mods.state[0].files[0], "Archive1.ba2");
        assert_eq!(mods.state[0].files[1], "Archive2.ba2");
    }
}

pub mod create_temp_folder_tests {
    use std::{fs, path::Path};

    use tempdir::TempDir;

    use crate::utils::test_utils;

    pub use super::*;

    #[test]
    fn test_create_temp_folder_from_file_success() {
        let tmp_dir = TempDir::new("unittest").unwrap();
        let example_file = Path::new("tests/fixtures/test.txt");
        let destination_file = tmp_dir.path().join("_tmp").join("test.txt");

        assert!(!destination_file.exists());
        let files = create_temp_folder_from_file_or_folder(tmp_dir.path(), example_file).unwrap();
        assert!(destination_file.is_file());
        assert_eq!(fs::read_to_string(destination_file).unwrap(), "test");
        assert_eq!(files.len(), 1);
        match &files[0] {
            DirEntry::File { name, .. } => assert_eq!(name, "test.txt"),
            DirEntry::Folder { .. } => panic!("files[0] is DirEntry::Folder"),
        };
    }

    #[test]
    fn test_create_temp_folder_from_file_failure() {
        let tmp_dir = TempDir::new("unittest").unwrap();
        let non_existant_file = Path::new("this_file_should_not_exist.txt");

        assert!(!non_existant_file.exists());
        let result = create_temp_folder_from_file_or_folder(tmp_dir.path(), non_existant_file);
        assert!(result.is_err());
    }

    #[test]
    fn test_create_temp_folder_from_archive_success() {
        let tmp_dir = TempDir::new("unittest").unwrap();
        let example_file = Path::new("tests/fixtures/test.zip");
        let destination_file = tmp_dir.path().join("_tmp").join("test.txt");

        assert!(!destination_file.exists());
        let files = create_temp_folder_from_archive(tmp_dir.path(), example_file).unwrap();
        assert!(destination_file.is_file());
        assert_eq!(fs::read_to_string(destination_file).unwrap(), "test");
        assert_eq!(files.len(), 1);
        match &files[0] {
            DirEntry::File { name, .. } => assert_eq!(name, "test.txt"),
            DirEntry::Folder { .. } => panic!("files[0] is DirEntry::Folder"),
        };
    }

    #[test]
    fn test_create_temp_folder_from_file_or_archive_with_txt_success() {
        let tmp_dir = TempDir::new("unittest").unwrap();
        let example_file = Path::new("tests/fixtures/test.txt");
        let destination_file = tmp_dir.path().join("_tmp").join("test.txt");

        assert!(!destination_file.exists());
        let files = create_temp_folder_from_file_or_archive(tmp_dir.path(), example_file).unwrap();
        assert!(destination_file.is_file());
        assert_eq!(fs::read_to_string(destination_file).unwrap(), "test");
        assert_eq!(files.len(), 1);
        match &files[0] {
            DirEntry::File { name, .. } => assert_eq!(name, "test.txt"),
            DirEntry::Folder { .. } => panic!("files[0] is DirEntry::Folder"),
        };
    }

    #[test]
    fn test_create_temp_folder_from_file_or_archive_with_zip_success() {
        let tmp_dir = TempDir::new("unittest").unwrap();
        let example_file = Path::new("tests/fixtures/test.zip");
        let destination_file = tmp_dir.path().join("_tmp").join("test.txt");

        assert!(!destination_file.exists());
        let files = create_temp_folder_from_file_or_archive(tmp_dir.path(), example_file).unwrap();
        assert!(destination_file.is_file());
        assert_eq!(fs::read_to_string(destination_file).unwrap(), "test");
        assert_eq!(files.len(), 1);
        match &files[0] {
            DirEntry::File { name, .. } => assert_eq!(name, "test.txt"),
            DirEntry::Folder { .. } => panic!("files[0] is DirEntry::Folder"),
        };
    }

    #[test]
    fn test_create_temp_folder_from_folder_success() {
        let tmp_dir = TempDir::new("unittest").unwrap();
        let example_file = Path::new("tests/fixtures/test.txt");
        let source_folder = tmp_dir.path().join("folder");
        let source_file = source_folder.join("test.txt");
        let destination_file = tmp_dir.path().join("_tmp").join("test.txt");

        fs::create_dir(&source_folder).unwrap();
        fs::copy(example_file, &source_file).unwrap();
        assert!(source_file.exists());

        assert!(!destination_file.exists());
        let files =
            create_temp_folder_from_folder_contents(tmp_dir.path(), &source_folder).unwrap();
        assert!(destination_file.is_file());
        assert_eq!(fs::read_to_string(destination_file).unwrap(), "test");
        assert_eq!(files.len(), 1);
        match &files[0] {
            DirEntry::File { name, .. } => assert_eq!(name, "test.txt"),
            DirEntry::Folder { .. } => panic!("files[0] is DirEntry::Folder"),
        };
    }

    #[test]
    fn test_create_temp_folder_from_folder_failure() {
        let tmp_dir = TempDir::new("unittest").unwrap();
        let non_existant_folder = Path::new("this_folder_should_not_exist");

        assert!(!non_existant_folder.exists());
        let result = create_temp_folder_from_folder_contents(tmp_dir.path(), non_existant_folder);
        assert!(result.is_err());
    }

    #[test]
    fn test_create_temp_folder_from_multiple_files_and_folders_success() {
        test_utils::setup_stdout_logger();
        let tmp_dir = TempDir::new("unittest").unwrap();
        let example_file = Path::new("tests/fixtures/test.txt");

        let source_folder = tmp_dir.path().join("src");
        let destination_folder = tmp_dir.path().join("_tmp");

        fs::create_dir_all(source_folder.join("folder")).unwrap();
        fs::copy(example_file, source_folder.join("test.txt")).unwrap();
        fs::copy(example_file, source_folder.join("folder").join("test.txt")).unwrap();

        /*
            Copying file "src/test.txt" to "_tmp/test.txt"
            Copying folder "src/folder" to "_tmp/folder"
        */
        let files = create_temp_folder_from_files_or_folders(
            tmp_dir.path(),
            &[source_folder.join("test.txt"), source_folder.join("folder")],
        )
        .unwrap();

        assert!(destination_folder.join("test.txt").is_file());
        assert_eq!(
            fs::read_to_string(destination_folder.join("test.txt")).unwrap(),
            "test"
        );
        assert!(destination_folder.join("folder").join("test.txt").is_file());
        assert_eq!(
            fs::read_to_string(destination_folder.join("folder").join("test.txt")).unwrap(),
            "test"
        );

        assert_eq!(files.len(), 2);

        // Find the file and folder entries (order may vary)
        let file_entry = files
            .iter()
            .find(|f| matches!(f, DirEntry::File { name, .. } if name == "test.txt"))
            .unwrap();
        let folder_entry = files
            .iter()
            .find(|f| matches!(f, DirEntry::Folder { name, .. } if name == "folder"))
            .unwrap();

        match file_entry {
            DirEntry::File { name, .. } => assert_eq!(name, "test.txt"),
            DirEntry::Folder { .. } => panic!("Expected file but got folder"),
        };

        match folder_entry {
            DirEntry::File { .. } => panic!("Expected folder but got file"),
            DirEntry::Folder { name, contents, .. } => {
                assert_eq!(name, "folder");
                assert_eq!(contents.len(), 1);
                match &contents[0] {
                    DirEntry::File { name, .. } => assert_eq!(name, "test.txt"),
                    DirEntry::Folder { .. } => panic!("contents[0] is DirEntry::Folder"),
                }
            }
        };
    }
}

pub mod detect_root_folder_tests {
    use std::fs;

    use tempdir::TempDir;

    pub use super::*;

    #[test]
    fn test_detect_root_folder_dlls() {
        let tmp_dir = TempDir::new("unittest").unwrap();
        let mod_path = tmp_dir.path();

        fs_util::write_to_file(mod_path.join("file.dll"), "").unwrap();

        let result = detect_root_folder(mod_path).unwrap();
        assert_eq!(result, ".");
    }

    #[test]
    fn test_detect_root_folder_ba2_in_root() {
        let tmp_dir = TempDir::new("unittest").unwrap();
        let mod_path = tmp_dir.path();

        fs_util::write_to_file(mod_path.join("file.ba2"), "").unwrap();

        let result = detect_root_folder(mod_path).unwrap();
        assert_eq!(result, "Data");
    }

    #[test]
    fn test_detect_root_folder_ba2_in_data() {
        let tmp_dir = TempDir::new("unittest").unwrap();
        let mod_path = tmp_dir.path();

        fs::create_dir_all(mod_path.join("Data")).unwrap();
        fs_util::write_to_file(mod_path.join("Data").join("file.ba2"), "").unwrap();

        let result = detect_root_folder(mod_path).unwrap();
        assert_eq!(result, ".");
    }

    #[test]
    fn test_detect_root_folder_strings_in_root() {
        let tmp_dir = TempDir::new("unittest").unwrap();
        let mod_path = tmp_dir.path();

        fs_util::write_to_file(mod_path.join("file.dlstrings"), "").unwrap();

        let result = detect_root_folder(mod_path).unwrap();
        assert_eq!(result, "Data/Strings");
    }

    #[test]
    fn test_detect_root_folder_strings_in_strings() {
        let tmp_dir = TempDir::new("unittest").unwrap();
        let mod_path = tmp_dir.path();

        fs::create_dir_all(mod_path.join("Strings")).unwrap();
        fs_util::write_to_file(mod_path.join("Strings").join("file.dlstrings"), "").unwrap();

        let result = detect_root_folder(mod_path).unwrap();
        assert_eq!(result, "Data");
    }

    #[test]
    fn test_detect_root_folder_strings_in_data_strings() {
        let tmp_dir = TempDir::new("unittest").unwrap();
        let mod_path = tmp_dir.path();

        fs::create_dir_all(mod_path.join("Data").join("Strings")).unwrap();
        fs_util::write_to_file(
            mod_path.join("Data").join("Strings").join("file.dlstrings"),
            "",
        )
        .unwrap();

        let result = detect_root_folder(mod_path).unwrap();
        assert_eq!(result, ".");
    }
}

pub mod diagnose_issues_tests {
    use tempdir::TempDir;

    pub use super::*;

    #[test]
    fn test_diagnose_issues_empty_folder() {
        let tmp_dir = TempDir::new("unittest").unwrap();
        let game_path = tmp_dir.path();
        let mod_path = game_path.join("Mods").join("Mod folder");
        let mod_details = ManagedMod::default();

        fs::create_dir_all(&mod_path).unwrap();

        let result = diagnose_issues(mod_details, &mod_path).unwrap();
        assert_eq!(result.len(), 1);
        assert!(matches!(result[0], DiagnosticIssue::EmptyFolder));
    }

    #[test]
    fn test_diagnose_issues_no_mod_files() {
        let tmp_dir = TempDir::new("unittest").unwrap();
        let game_path = tmp_dir.path();
        let mod_path = game_path.join("Mods").join("Mod folder");
        let mod_details = ManagedMod::default();

        fs::create_dir_all(&mod_path).unwrap();
        fs_util::write_to_file(mod_path.join("README.txt"), "").unwrap();
        fs_util::write_to_file(mod_path.join("LICENSE.md"), "").unwrap();
        fs_util::write_to_file(mod_path.join("screenshot.png"), "").unwrap();
        fs_util::write_to_file(mod_path.join("Fallout76Custom.ini"), "").unwrap();

        let result = diagnose_issues(mod_details, &mod_path).unwrap();
        assert_eq!(result.len(), 1);
        assert!(matches!(result[0], DiagnosticIssue::NoModFilesFound));
    }

    #[test]
    fn test_diagnose_issues_wrong_folder_for_archives_1() {
        let tmp_dir = TempDir::new("unittest").unwrap();
        let game_path = tmp_dir.path();
        let mod_path = game_path.join("Mods").join("Mod folder");
        let mut mod_details = ManagedMod::default();

        fs::create_dir_all(&mod_path).unwrap();
        fs_util::write_to_file(mod_path.join("file.ba2"), "").unwrap();

        let result = diagnose_issues(mod_details.clone(), &mod_path).unwrap();
        assert_eq!(result.len(), 1);
        assert!(matches!(result[0], DiagnosticIssue::WrongFolderForArchives));

        mod_details.options.root_folder = "Data".to_string();
        let result = diagnose_issues(mod_details, &mod_path).unwrap();
        assert_eq!(result.len(), 0);
    }

    #[test]
    fn test_diagnose_issues_wrong_folder_for_archives_2() {
        let tmp_dir = TempDir::new("unittest").unwrap();
        let game_path = tmp_dir.path();
        let mod_path = game_path.join("Mods").join("Mod folder");
        let mut mod_details = ManagedMod::default();

        let data_path = mod_path.join("Data");
        fs::create_dir_all(&data_path).unwrap();
        fs_util::write_to_file(data_path.join("file.ba2"), "").unwrap();

        let result = diagnose_issues(mod_details.clone(), &mod_path).unwrap();
        assert_eq!(result.len(), 0);

        mod_details.options.root_folder = "Data".to_string();
        let result = diagnose_issues(mod_details, &mod_path).unwrap();
        assert_eq!(result.len(), 1);
        assert!(matches!(result[0], DiagnosticIssue::WrongFolderForArchives));
    }

    #[test]
    fn test_diagnose_issues_wrong_folder_for_strings_1() {
        let tmp_dir = TempDir::new("unittest").unwrap();
        let game_path = tmp_dir.path();
        let mod_path = game_path.join("Mods").join("Mod folder");
        let mut mod_details = ManagedMod::default();

        fs::create_dir_all(&mod_path).unwrap();
        fs_util::write_to_file(mod_path.join("file.strings"), "").unwrap();
        fs_util::write_to_file(mod_path.join("file.dlstrings"), "").unwrap();
        fs_util::write_to_file(mod_path.join("file.ilstrings"), "").unwrap();

        let result = diagnose_issues(mod_details.clone(), &mod_path).unwrap();
        assert_eq!(result.len(), 1);
        assert!(matches!(result[0], DiagnosticIssue::WrongFolderForStrings));

        mod_details.options.root_folder = "Data/Strings".to_string();
        let result = diagnose_issues(mod_details, &mod_path).unwrap();
        assert_eq!(result.len(), 0);
    }

    #[test]
    fn test_diagnose_issues_wrong_folder_for_strings_2() {
        let tmp_dir = TempDir::new("unittest").unwrap();
        let game_path = tmp_dir.path();
        let mod_path = game_path.join("Mods").join("Mod folder");
        let mut mod_details = ManagedMod::default();

        let strings_path = mod_path.join("Strings");
        fs::create_dir_all(&strings_path).unwrap();
        fs_util::write_to_file(strings_path.join("file.strings"), "").unwrap();
        fs_util::write_to_file(strings_path.join("file.dlstrings"), "").unwrap();
        fs_util::write_to_file(strings_path.join("file.ilstrings"), "").unwrap();

        let result = diagnose_issues(mod_details.clone(), &mod_path).unwrap();
        assert_eq!(result.len(), 1);
        assert!(matches!(result[0], DiagnosticIssue::WrongFolderForStrings));

        mod_details.options.root_folder = "Data".to_string();
        let result = diagnose_issues(mod_details, &mod_path).unwrap();
        assert_eq!(result.len(), 0);
    }

    #[test]
    fn test_diagnose_issues_wrong_folder_for_dlls_1() {
        let tmp_dir = TempDir::new("unittest").unwrap();
        let game_path = tmp_dir.path();
        let mod_path = game_path.join("Mods").join("Mod folder");
        let mut mod_details = ManagedMod::default();

        fs::create_dir_all(&mod_path).unwrap();
        fs_util::write_to_file(mod_path.join("file.dll"), "").unwrap();

        let result = diagnose_issues(mod_details.clone(), &mod_path).unwrap();
        assert_eq!(result.len(), 0);

        mod_details.options.root_folder = "Data".to_string();
        let result = diagnose_issues(mod_details, &mod_path).unwrap();
        assert_eq!(result.len(), 1);
        assert!(matches!(result[0], DiagnosticIssue::WrongFolderForDlls));
    }

    #[test]
    fn test_diagnose_issues_multiple_ba2_roots() {
        let tmp_dir = TempDir::new("unittest").unwrap();
        let game_path = tmp_dir.path();
        let mod_path = game_path.join("Mods").join("Mod folder");
        let mod_details = ManagedMod::default();

        fs::create_dir_all(&mod_path).unwrap();
        fs::create_dir_all(mod_path.join("red")).unwrap();
        fs::create_dir_all(mod_path.join("green")).unwrap();
        fs::create_dir_all(mod_path.join("blue")).unwrap();

        fs_util::write_to_file(mod_path.join("red").join("file.ba2"), "").unwrap();
        fs_util::write_to_file(mod_path.join("green").join("file.ba2"), "").unwrap();
        fs_util::write_to_file(mod_path.join("blue").join("file.ba2"), "").unwrap();

        let result = diagnose_issues(mod_details, &mod_path).unwrap();
        assert_eq!(result.len(), 2);
        assert!(matches!(result[0], DiagnosticIssue::WrongFolderForArchives));
        assert!(matches!(result[1], DiagnosticIssue::MultipleBA2Roots));
    }

    #[test]
    fn test_diagnose_issues_unpacked_files() {
        let tmp_dir = TempDir::new("unittest").unwrap();
        let game_path = tmp_dir.path();
        let mod_path = game_path.join("Mods").join("Mod folder");
        let mod_details = ManagedMod::default();

        fs::create_dir_all(&mod_path).unwrap();
        fs::create_dir_all(mod_path.join("meshes")).unwrap();
        fs::create_dir_all(mod_path.join("materials")).unwrap();

        fs_util::write_to_file(mod_path.join("meshes").join("file.nif"), "").unwrap();
        fs_util::write_to_file(mod_path.join("meshes").join("file.hkx"), "").unwrap();
        fs_util::write_to_file(mod_path.join("materials").join("file.bgem"), "").unwrap();
        fs_util::write_to_file(mod_path.join("materials").join("file.bgsm"), "").unwrap();

        let result = diagnose_issues(mod_details, &mod_path).unwrap();
        assert_eq!(result.len(), 1);
        assert!(matches!(result[0], DiagnosticIssue::UnpackedFiles));
    }
}
