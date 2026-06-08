use std::fs;

use tempdir::TempDir;

use crate::features::mods::models::json::{ManagedMod, ModInstallationOptions};
use crate::features::mods::utils::get_conflicting_files;
use crate::utils::fs_util;

#[test]
fn test_get_conflicting_files() {
    let temp_dir = TempDir::new("f76qc_test").expect("Failed to create temp dir");
    let mods_path = temp_dir.path();

    // Create mod folders
    let mod1_folder = mods_path.join("mod1");
    let mod2_folder = mods_path.join("mod2");
    let mod3_folder = mods_path.join("mod3");
    let mod4_folder = mods_path.join("mod4");

    fs::create_dir_all(&mod1_folder).expect("Failed to create mod1 folder");
    fs::create_dir_all(&mod2_folder).expect("Failed to create mod2 folder");
    fs::create_dir_all(&mod3_folder).expect("Failed to create mod3 folder");
    fs::create_dir_all(&mod4_folder).expect("Failed to create mod4 folder");

    // Mod 1: root ".", has Data/file.txt -> becomes "Data/file.txt"
    // Mod 1: root ".", has unique.txt    -> becomes "unique.txt" (no conflict)
    fs::create_dir_all(mod1_folder.join("Data")).expect("Failed to create Data dir in mod1");
    fs_util::write_to_file(mod1_folder.join("Data/file.txt"), "")
        .expect("Failed to create Data/file.txt");
    fs_util::write_to_file(mod1_folder.join("unique.txt"), "")
        .expect("Failed to create unique.txt");

    // Mod 2: root "Data", has file.txt   -> becomes "Data/file.txt" (CONFLICT with mod1)
    // Mod 2: root "Data", has unique.txt -> becomes "Data/unique.txt" (no conflict)
    fs_util::write_to_file(mod2_folder.join("file.txt"), "").expect("Failed to create file.txt");
    fs_util::write_to_file(mod2_folder.join("unique.txt"), "")
        .expect("Failed to create unique.txt");

    // Mod 3: root "Data/Strings", has en.txt -> becomes "Data/Strings/en.txt" (no conflict)
    fs_util::write_to_file(mod3_folder.join("en.txt"), "").expect("Failed to create en.txt");

    // Disabled mod - should not be checked
    // Mod 4: root "Data", has file.txt   -> becomes "Data/file.txt" (disabled, so no conflict)
    fs_util::write_to_file(mod4_folder.join("file.txt"), "")
        .expect("Failed to create file.txt in mod4");

    let mods = vec![
        ManagedMod {
            key: "mod1-id".to_string(),
            title: "Mod 1".to_string(),
            folder_name: "mod1".to_string(),
            version: "1.0".to_string(),
            url: "".to_string(),
            notes: "".to_string(),
            enabled: true,
            options: ModInstallationOptions {
                root_folder: ".".to_string(),
            },
        },
        ManagedMod {
            key: "mod2-id".to_string(),
            title: "Mod 2".to_string(),
            folder_name: "mod2".to_string(),
            version: "1.0".to_string(),
            url: "".to_string(),
            notes: "".to_string(),
            enabled: true,
            options: ModInstallationOptions {
                root_folder: "Data".to_string(),
            },
        },
        ManagedMod {
            key: "mod3-id".to_string(),
            title: "Mod 3".to_string(),
            folder_name: "mod3".to_string(),
            version: "1.0".to_string(),
            url: "".to_string(),
            notes: "".to_string(),
            enabled: true,
            options: ModInstallationOptions {
                root_folder: "Data/Strings".to_string(),
            },
        },
        ManagedMod {
            key: "mod4-id".to_string(),
            title: "Mod 4 (disabled)".to_string(),
            folder_name: "mod4".to_string(),
            version: "1.0".to_string(),
            url: "".to_string(),
            notes: "".to_string(),
            enabled: false,
            options: ModInstallationOptions {
                root_folder: "Data".to_string(),
            },
        },
    ];

    let conflicts =
        get_conflicting_files(mods_path, &mods).expect("Failed to get conflicting files");

    // Expected conflicts:
    // - mod2 overwrites mod1: "Data/file.txt" (mod2 has file.txt with root "Data" -> "Data/file.txt", mod1 has Data/file.txt with root "." -> "Data/file.txt")
    // - mod4 is disabled, so even though it has file.txt with root "Data" -> "Data/file.txt", it shouldn't conflict

    assert_eq!(
        conflicts.len(),
        1,
        "Expected 1 conflict, got {}",
        conflicts.len()
    );

    let conflict = &conflicts[0];
    assert_eq!(conflict.upper_mod_id, "mod1-id");
    assert_eq!(conflict.lower_mod_id, "mod2-id");
    if cfg!(target_os = "windows") {
        assert_eq!(conflict.files, vec!["Data\\file.txt"]);
    } else {
        assert_eq!(conflict.files, vec!["Data/file.txt"]);
    }
}
