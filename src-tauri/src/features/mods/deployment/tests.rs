#![cfg(test)]

use std::{fs, path::PathBuf};

use tempdir::TempDir;

use crate::features::mods::deployment::deploy_mods;
use crate::features::mods::models::json::{
    ManagedMod, ManagedMods, ModInstallationOptions, ModInstallationState,
};
use crate::features::resourcelists::ResourceList;
use crate::features::stores::settings::models::{ModCopyMethod, ResourceInsertionPosition};
use crate::utils::{fs_util, test_utils};

struct TestPaths {
    #[allow(unused)] // TempDir should not be dropped or it deletes the temporary folder
    tmp_dir: TempDir,
    game_path: PathBuf,
    game_data_path: PathBuf,
    mods_path: PathBuf,
}

impl TestPaths {
    fn new() -> TestPaths {
        let tmp_dir = TempDir::new("unittest").unwrap();
        TestPaths {
            game_path: tmp_dir.path().to_path_buf(),
            game_data_path: tmp_dir.path().join("Data"),
            mods_path: tmp_dir.path().join("Mods"),
            tmp_dir,
        }
    }
}

#[test]
fn test_deploy_mods_1() {
    test_utils::setup_stdout_logger();
    let paths = TestPaths::new();
    let mut mods = ManagedMods::default();
    let mut list = ResourceList::parse("UnmanagedArchive.ba2,AnotherUnmanagedArchive.ba2");
    let copy_method = ModCopyMethod::Copy;

    // Setup files and folders:
    fs::create_dir_all(&paths.game_data_path).unwrap();
    fs::create_dir_all(&paths.mods_path).unwrap();

    // Mod 1: Deploy Managed.ba2 to Data
    let mod1 = ManagedMod {
        title: "BA2 Mod".to_string(),
        folder_name: "BA2Mod".to_string(),
        enabled: true,
        options: ModInstallationOptions {
            root_folder: "Data".to_string(),
        },
        ..Default::default()
    };
    let mod1_path = paths.mods_path.join(&mod1.folder_name);
    fs::create_dir_all(&mod1_path).unwrap();
    fs_util::write_to_file(mod1_path.join("Managed.ba2"), "").unwrap();
    mods.mods.push(mod1);

    // Mod 2: DLL file deployed to game root (".")
    let mod2 = ManagedMod {
        title: "DLL Mod".to_string(),
        folder_name: "DLLMod".to_string(),
        enabled: true,
        options: ModInstallationOptions {
            root_folder: ".".to_string(),
        },
        ..Default::default()
    };
    let mod2_path = paths.mods_path.join(&mod2.folder_name);
    fs::create_dir_all(&mod2_path).unwrap();
    fs_util::write_to_file(mod2_path.join("CustomPlugin.dll"), "").unwrap();
    mods.mods.push(mod2);

    // Mod 3: String files deployed to Data/Strings
    let mod3 = ManagedMod {
        title: "String Files Mod".to_string(),
        folder_name: "StringFilesMod".to_string(),
        enabled: true,
        options: ModInstallationOptions {
            root_folder: "Data/Strings".to_string(),
        },
        ..Default::default()
    };
    let mod3_path = paths.mods_path.join(&mod3.folder_name);
    fs::create_dir_all(&mod3_path).unwrap();
    fs_util::write_to_file(mod3_path.join("English.strings"), "").unwrap();
    fs_util::write_to_file(mod3_path.join("Dialogue.dlstrings"), "").unwrap();
    fs_util::write_to_file(mod3_path.join("Interface.ilstrings"), "").unwrap();
    mods.mods.push(mod3);

    // Mod 4: INI file deployed to Data
    let mod4 = ManagedMod {
        title: "Config Mod".to_string(),
        folder_name: "ConfigMod".to_string(),
        enabled: true,
        options: ModInstallationOptions {
            root_folder: "Data".to_string(),
        },
        ..Default::default()
    };
    let mod4_path = paths.mods_path.join(&mod4.folder_name);
    fs::create_dir_all(&mod4_path).unwrap();
    fs_util::write_to_file(mod4_path.join("CustomConfig.ini"), "").unwrap();
    mods.mods.push(mod4);

    // Mod 5: BK2 file deployed to Data/Videos
    let mod5 = ManagedMod {
        title: "Video Mod".to_string(),
        folder_name: "VideoMod".to_string(),
        enabled: true,
        options: ModInstallationOptions {
            root_folder: "Data/Videos".to_string(),
        },
        ..Default::default()
    };
    let mod5_path = paths.mods_path.join(&mod5.folder_name);
    fs::create_dir_all(&mod5_path).unwrap();
    fs_util::write_to_file(mod5_path.join("Intro.bk2"), "").unwrap();
    mods.mods.push(mod5);

    // Mod 6: Disabled mod (should not be deployed)
    let mod6 = ManagedMod {
        title: "Disabled Mod".to_string(),
        folder_name: "DisabledMod".to_string(),
        enabled: false,
        options: ModInstallationOptions {
            root_folder: "Data".to_string(),
        },
        ..Default::default()
    };
    let mod6_path = paths.mods_path.join(&mod6.folder_name);
    fs::create_dir_all(&mod6_path).unwrap();
    fs_util::write_to_file(mod6_path.join("ShouldNotDeploy.txt"), "").unwrap();
    mods.mods.push(mod6);

    // Mod 7: Mod with nested folder structure
    let mod7 = ManagedMod {
        title: "Nested Mod".to_string(),
        folder_name: "NestedMod".to_string(),
        enabled: true,
        options: ModInstallationOptions {
            root_folder: "Data".to_string(),
        },
        ..Default::default()
    };
    let mod7_path = paths.mods_path.join(&mod7.folder_name);
    fs::create_dir_all(&mod7_path.join("Textures/Armor/Head")).unwrap();
    fs_util::write_to_file(mod7_path.join("Textures/Armor/Head/Helmet.dds"), "").unwrap();
    mods.mods.push(mod7);

    // Mod 8: Empty mod folder (should deploy nothing)
    let mod8 = ManagedMod {
        title: "Empty Mod".to_string(),
        folder_name: "EmptyMod".to_string(),
        enabled: true,
        options: ModInstallationOptions {
            root_folder: "Data".to_string(),
        },
        ..Default::default()
    };
    let mod8_path = paths.mods_path.join(&mod8.folder_name);
    fs::create_dir_all(&mod8_path).unwrap();
    mods.mods.push(mod8);

    // Deploy mods:
    deploy_mods(
        &mut mods,
        &mut list,
        &paths.mods_path,
        &paths.game_path,
        copy_method,
        ResourceInsertionPosition::Append,
        true,
        None,
    )
    .unwrap();

    // Verify deployment:
    // Mod 1: Managed.ba2 in Data
    assert!(paths.game_data_path.join("Managed.ba2").is_file());

    // Mod 2: DLL in game root
    assert!(paths.game_path.join("CustomPlugin.dll").is_file());

    // Mod 3: String files in Data/Strings
    assert!(
        paths
            .game_data_path
            .join("Strings")
            .join("English.strings")
            .is_file()
    );
    assert!(
        paths
            .game_data_path
            .join("Strings")
            .join("Dialogue.dlstrings")
            .is_file()
    );
    assert!(
        paths
            .game_data_path
            .join("Strings")
            .join("Interface.ilstrings")
            .is_file()
    );

    // Mod 4: INI file in Data
    assert!(paths.game_data_path.join("CustomConfig.ini").is_file());

    // Mod 5: BK2 file in Data/Videos
    assert!(
        paths
            .game_data_path
            .join("Videos")
            .join("Intro.bk2")
            .is_file()
    );

    // Mod 6: Disabled mod should NOT be deployed
    assert!(!paths.game_data_path.join("ShouldNotDeploy.txt").is_file());

    // Mod 7: Nested file structure in Data
    assert!(
        paths
            .game_data_path
            .join("Textures")
            .join("Armor")
            .join("Head")
            .join("Helmet.dds")
            .is_file()
    );

    // Verify state and resource list
    // Only .ba2 files are added to the resource list
    assert_eq!(mods.state.len(), 7);
    assert_eq!(
        list.serialize(","),
        "UnmanagedArchive.ba2,AnotherUnmanagedArchive.ba2,Managed.ba2"
    );
}

#[test]
fn test_deploy_mods_2() {
    test_utils::setup_stdout_logger();
    let paths = TestPaths::new();
    let mut mods = ManagedMods::default();
    let mut list = ResourceList::parse("");
    let copy_method = ModCopyMethod::Copy;

    // Setup files and folders:
    fs::create_dir_all(&paths.game_data_path).unwrap();
    fs::create_dir_all(&paths.mods_path).unwrap();

    // Mod 1: Previously deployed but now disabled (files should be removed)
    let mod1 = ManagedMod {
        key: "mod1-key".to_string(),
        title: "Mod 1".to_string(),
        folder_name: "Mod1".to_string(),
        enabled: false,
        options: ModInstallationOptions {
            root_folder: "Data".to_string(),
        },
        ..Default::default()
    };
    let mod1_path = paths.mods_path.join(&mod1.folder_name);
    fs::create_dir_all(&mod1_path).unwrap();
    fs_util::write_to_file(mod1_path.join("Managed.ba2"), "").unwrap();

    // Simulate existing deployment in game folder
    fs_util::write_to_file(paths.game_data_path.join("Managed.ba2"), "").unwrap();

    // Add state for mod1
    mods.state.push(ModInstallationState {
        key: "mod1-key".to_string(),
        root_folder: "Data".to_string(),
        files: vec!["Managed.ba2".to_string()],
    });
    mods.mods.push(mod1);

    // Mod 2: Still enabled with mixed path separators in state
    let mod2 = ManagedMod {
        key: "mod2-key".to_string(),
        title: "Path Separator Mod".to_string(),
        folder_name: "PathSeparatorMod".to_string(),
        enabled: true,
        options: ModInstallationOptions {
            root_folder: "Data".to_string(),
        },
        ..Default::default()
    };
    let mod2_path = paths.mods_path.join(&mod2.folder_name);
    fs::create_dir_all(&mod2_path.join("SubFolder").join("SubSubFolder")).unwrap();
    fs_util::write_to_file(
        mod2_path
            .join("SubFolder")
            .join("SubSubFolder")
            .join("MixedPath.txt"),
        "new mixed content",
    )
    .unwrap();

    // Simulate existing deployment in game folder
    fs::create_dir_all(&paths.game_data_path.join("SubFolder").join("SubSubFolder")).unwrap();
    fs_util::write_to_file(
        paths
            .game_data_path
            .join("SubFolder")
            .join("SubSubFolder")
            .join("MixedPath.txt"),
        "old mixed content",
    )
    .unwrap();

    // Add state for mod2 with mixed path separators (slash + backslash)
    mods.state.push(ModInstallationState {
        key: "mod2-key".to_string(),
        root_folder: "Data".to_string(),
        files: vec!["SubFolder\\SubSubFolder/MixedPath.txt".to_string()],
    });
    mods.mods.push(mod2);

    // Mod 3: Config mod with INI file (should NOT overwrite existing config)
    let mod3 = ManagedMod {
        key: "mod3-key".to_string(),
        title: "Config Mod".to_string(),
        folder_name: "ConfigMod".to_string(),
        enabled: true,
        options: ModInstallationOptions {
            root_folder: "Data".to_string(),
        },
        ..Default::default()
    };
    let mod3_path = paths.mods_path.join(&mod3.folder_name);
    fs::create_dir_all(&mod3_path).unwrap();
    fs_util::write_to_file(mod3_path.join("CustomConfig.ini"), "new config from mod").unwrap();

    // Simulate existing config file in game folder (user modified)
    fs_util::write_to_file(
        paths.game_data_path.join("CustomConfig.ini"),
        "user modified config",
    )
    .unwrap();

    // Add state for mod3
    mods.state.push(ModInstallationState {
        key: "mod3-key".to_string(),
        root_folder: "Data".to_string(),
        files: vec!["CustomConfig.ini".to_string()],
    });
    mods.mods.push(mod3);

    // Deploy mods:
    deploy_mods(
        &mut mods,
        &mut list,
        &paths.mods_path,
        &paths.game_path,
        copy_method,
        ResourceInsertionPosition::Append,
        true,
        None,
    )
    .unwrap();

    // Verify Mod 1: disabled mod files should be removed
    assert!(!paths.game_data_path.join("Managed.ba2").is_file());

    // Verify Mod 2: mixed path separators work - file should be updated
    assert!(
        paths
            .game_data_path
            .join("SubFolder")
            .join("SubSubFolder")
            .join("MixedPath.txt")
            .is_file()
    );
    assert_eq!(
        fs::read_to_string(
            paths
                .game_data_path
                .join("SubFolder")
                .join("SubSubFolder")
                .join("MixedPath.txt")
        )
        .unwrap(),
        "new mixed content"
    );

    // Verify Mod 3: user-modified configs shoulb be preserved
    assert!(paths.game_data_path.join("CustomConfig.ini").is_file());
    assert_eq!(
        fs::read_to_string(paths.game_data_path.join("CustomConfig.ini")).unwrap(),
        "user modified config"
    );
}

#[test]
fn test_deploy_mods_3() {
    test_utils::setup_stdout_logger();
    let paths = TestPaths::new();
    let mut mods = ManagedMods::default();
    let mut list = ResourceList::parse("");
    let copy_method = ModCopyMethod::Copy;

    // Setup files and folders:
    fs::create_dir_all(&paths.game_data_path).unwrap();
    fs::create_dir_all(&paths.mods_path).unwrap();

    // Mod 1: Deploys to a file that already exists (unmanaged, not in previous state) - should create .old backup
    let mod1 = ManagedMod {
        key: "mod1-key".to_string(),
        title: "Mod 1".to_string(),
        folder_name: "Mod1".to_string(),
        enabled: true,
        options: ModInstallationOptions {
            root_folder: "Data".to_string(),
        },
        ..Default::default()
    };
    let mod1_path = paths.mods_path.join(&mod1.folder_name);
    fs::create_dir_all(&mod1_path).unwrap();
    fs_util::write_to_file(mod1_path.join("ExistingFile.txt"), "mod1 content").unwrap();

    // Pre-existing file in game folder (unmanaged - not in state)
    fs_util::write_to_file(
        paths.game_data_path.join("ExistingFile.txt"),
        "original content",
    )
    .unwrap();

    // No state for mod1 initially - it's a new deployment
    mods.mods.push(mod1);

    // Mod 2: Also deploys to the same file - .old file should NOT be overwritten
    let mod2 = ManagedMod {
        key: "mod2-key".to_string(),
        title: "Mod 2".to_string(),
        folder_name: "Mod2".to_string(),
        enabled: true,
        options: ModInstallationOptions {
            root_folder: "Data".to_string(),
        },
        ..Default::default()
    };
    let mod2_path = paths.mods_path.join(&mod2.folder_name);
    fs::create_dir_all(&mod2_path).unwrap();
    fs_util::write_to_file(mod2_path.join("ExistingFile.txt"), "mod2 content").unwrap();

    // Also no state for Mod 2:
    mods.mods.push(mod2);

    // Mod 3: Previously deployed, now disabled - .old should be restored
    let mod3 = ManagedMod {
        key: "mod3-key".to_string(),
        title: "Mod 3".to_string(),
        folder_name: "Mod3".to_string(),
        enabled: false, // Disabled - files should be removed and .old restored
        options: ModInstallationOptions {
            root_folder: "Data".to_string(),
        },
        ..Default::default()
    };
    let mod3_path = paths.mods_path.join(&mod3.folder_name);
    fs::create_dir_all(&mod3_path).unwrap();
    fs_util::write_to_file(mod3_path.join("BackupFile.txt"), "mod3 content").unwrap();

    // Pre-existing file with .old backup (from previous deployment)
    fs_util::write_to_file(
        paths.game_data_path.join("BackupFile.txt.old"),
        "original backup",
    )
    .unwrap();
    fs_util::write_to_file(
        paths.game_data_path.join("BackupFile.txt"),
        "will be removed",
    )
    .unwrap();

    // Add state for mod3 (was previously deployed)
    mods.state.push(ModInstallationState {
        key: "mod3-key".to_string(),
        root_folder: "Data".to_string(),
        files: vec!["BackupFile.txt".to_string()],
    });
    mods.mods.push(mod3);

    // Deploy mods:
    deploy_mods(
        &mut mods,
        &mut list,
        &paths.mods_path,
        &paths.game_path,
        copy_method,
        ResourceInsertionPosition::Append,
        true,
        None,
    )
    .unwrap();

    // Verify Mod 1 & Mod 2: .old file created for ExistingFile.txt
    assert!(paths.game_data_path.join("ExistingFile.txt").is_file());
    assert!(paths.game_data_path.join("ExistingFile.txt.old").is_file());
    // .old file should contain the original content (not overwritten by mod2's deployment)
    assert_eq!(
        fs::read_to_string(paths.game_data_path.join("ExistingFile.txt.old")).unwrap(),
        "original content"
    );
    // The deployed file should have mod2's content (mod2 was deployed after mod1)
    assert_eq!(
        fs::read_to_string(paths.game_data_path.join("ExistingFile.txt")).unwrap(),
        "mod2 content"
    );

    // Verify Mod 3: disabled mod's file removed and .old restored
    // When mod3 is disabled, BackupFile.txt is removed and BackupFile.txt.old is restored to BackupFile.txt
    assert!(paths.game_data_path.join("BackupFile.txt").is_file());
    assert!(!paths.game_data_path.join("BackupFile.txt.old").exists());
    // The restored file should contain the original backup content
    assert_eq!(
        fs::read_to_string(paths.game_data_path.join("BackupFile.txt")).unwrap(),
        "original backup"
    );
}
