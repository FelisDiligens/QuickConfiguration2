#![cfg(test)]

use std::fs;
use std::path::{Path, PathBuf};

use indoc::indoc;
use ini::Ini;
use tempdir::TempDir;

use crate::features::mods::{get_mods_temp_path, load_mods};
use crate::utils::{fs_util, test_utils};

struct TestPaths {
    #[allow(unused)] // TempDir should not be dropped or it deletes the temporary folder
    tmp_dir: TempDir,
    game_path: PathBuf,
    game_data_path: PathBuf,
    mods_path: PathBuf,
    frozen_data_path: PathBuf,
}

impl TestPaths {
    fn new() -> TestPaths {
        let tmp_dir = TempDir::new("unittest").unwrap();
        TestPaths {
            game_path: tmp_dir.path().to_path_buf(),
            game_data_path: tmp_dir.path().join("Data"),
            mods_path: tmp_dir.path().join("Mods"),
            frozen_data_path: tmp_dir.path().join("FrozenData"),
            tmp_dir,
        }
    }
}

fn setup_test_case_1() -> TestPaths {
    let paths = TestPaths::new();
    let managed_xml = indoc! {r#"
        <?xml version="1.0" encoding="utf-8"?>
        <ManagedMods enabled="true" nwmode="false">
        <Mod guid="140632ba-2213-4bb7-9287-4c27948e23ea">
            <Title>ModBundled</Title>
            <Folder>ModBundled</Folder>
            <Version>1.0</Version>
            <NexusMods id="-1">
            <URL></URL>
            </NexusMods>
            <DiskState>
            <Current isDeployed="true">
                <InstallationMethod>BundledBA2</InstallationMethod>
                <ArchiveName></ArchiveName>
                <ArchiveFormat>Auto</ArchiveFormat>
                <ArchiveCompression>Auto</ArchiveCompression>
                <RootFolder>.</RootFolder>
                <InstalledLooseFiles />
            </Current>
            <Pending isEnabled="true">
                <InstallationMethod>BundledBA2</InstallationMethod>
                <ArchiveName>untitled.ba2</ArchiveName>
                <ArchiveFormat>Auto</ArchiveFormat>
                <ArchiveCompression>Auto</ArchiveCompression>
                <RootFolder>.</RootFolder>
            </Pending>
            <FrozenData isFrozen="false" freeze="false">
                <ArchiveFormat>Auto</ArchiveFormat>
                <ArchiveCompression>Auto</ArchiveCompression>
            </FrozenData>
            </DiskState>
            <Notes></Notes>
        </Mod>
        <Mod guid="7d82ab8e-f144-4ed1-8bdd-d80fc7977986">
            <Title>ModSeparate</Title>
            <Folder>ModSeparate</Folder>
            <Version>1.0</Version>
            <NexusMods id="-1">
            <URL></URL>
            </NexusMods>
            <DiskState>
            <Current isDeployed="true">
                <InstallationMethod>SeparateBA2</InstallationMethod>
                <ArchiveName>ModSeparate.ba2</ArchiveName>
                <ArchiveFormat>Textures</ArchiveFormat>
                <ArchiveCompression>Compressed</ArchiveCompression>
                <RootFolder>.</RootFolder>
                <InstalledLooseFiles />
            </Current>
            <Pending isEnabled="true">
                <InstallationMethod>SeparateBA2</InstallationMethod>
                <ArchiveName>ModSeparate.ba2</ArchiveName>
                <ArchiveFormat>Textures</ArchiveFormat>
                <ArchiveCompression>Compressed</ArchiveCompression>
                <RootFolder>.</RootFolder>
            </Pending>
            <FrozenData isFrozen="false" freeze="false">
                <ArchiveFormat>Textures</ArchiveFormat>
                <ArchiveCompression>Compressed</ArchiveCompression>
            </FrozenData>
            </DiskState>
            <Notes></Notes>
        </Mod>
        <Mod guid="7523cddd-4e64-484f-9b04-5b91d7073db4">
            <Title>ModSeparateAuto</Title>
            <Folder>ModSeparateAuto</Folder>
            <Version>1.0</Version>
            <NexusMods id="-1">
            <URL></URL>
            </NexusMods>
            <DiskState>
            <Current isDeployed="true">
                <InstallationMethod>SeparateBA2</InstallationMethod>
                <ArchiveName>ModSeparateAuto.ba2</ArchiveName>
                <ArchiveFormat>Auto</ArchiveFormat>
                <ArchiveCompression>Auto</ArchiveCompression>
                <RootFolder>.</RootFolder>
                <InstalledLooseFiles />
            </Current>
            <Pending isEnabled="true">
                <InstallationMethod>SeparateBA2</InstallationMethod>
                <ArchiveName>ModSeparateAuto.ba2</ArchiveName>
                <ArchiveFormat>Auto</ArchiveFormat>
                <ArchiveCompression>Auto</ArchiveCompression>
                <RootFolder>Data</RootFolder>
            </Pending>
            <FrozenData isFrozen="false" freeze="false">
                <ArchiveFormat>Auto</ArchiveFormat>
                <ArchiveCompression>Auto</ArchiveCompression>
            </FrozenData>
            </DiskState>
            <Notes></Notes>
        </Mod>
        <Mod guid="447f7391-da2c-40df-82f3-80af9a8b9304">
            <Title>ModSeparateFrozen</Title>
            <Folder>ModSeparateFrozen</Folder>
            <Version>1.0</Version>
            <NexusMods id="-1">
            <URL></URL>
            </NexusMods>
            <DiskState>
            <Current isDeployed="true">
                <InstallationMethod>SeparateBA2</InstallationMethod>
                <ArchiveName>ModSeparateFrozen.ba2</ArchiveName>
                <ArchiveFormat>Textures</ArchiveFormat>
                <ArchiveCompression>Compressed</ArchiveCompression>
                <RootFolder>.</RootFolder>
                <InstalledLooseFiles />
            </Current>
            <Pending isEnabled="true">
                <InstallationMethod>SeparateBA2</InstallationMethod>
                <ArchiveName>ModSeparateFrozen.ba2</ArchiveName>
                <ArchiveFormat>Textures</ArchiveFormat>
                <ArchiveCompression>Compressed</ArchiveCompression>
                <RootFolder>.</RootFolder>
            </Pending>
            <FrozenData isFrozen="true" freeze="true">
                <ArchiveFormat>Textures</ArchiveFormat>
                <ArchiveCompression>Compressed</ArchiveCompression>
            </FrozenData>
            </DiskState>
            <Notes></Notes>
        </Mod>
        <Mod guid="db36164f-13c2-4b29-ad10-205dc0484a08">
            <Title>ModLoose</Title>
            <Folder>ModLoose</Folder>
            <Version>1.0</Version>
            <NexusMods id="-1">
            <URL></URL>
            </NexusMods>
            <DiskState>
            <Current isDeployed="true">
                <InstallationMethod>LooseFiles</InstallationMethod>
                <ArchiveName></ArchiveName>
                <ArchiveFormat>Auto</ArchiveFormat>
                <ArchiveCompression>Auto</ArchiveCompression>
                <RootFolder>.</RootFolder>
                <InstalledLooseFiles>
                <File path=".\test.dll" />
                </InstalledLooseFiles>
            </Current>
            <Pending isEnabled="true">
                <InstallationMethod>LooseFiles</InstallationMethod>
                <ArchiveName>untitled.ba2</ArchiveName>
                <ArchiveFormat>Auto</ArchiveFormat>
                <ArchiveCompression>Auto</ArchiveCompression>
                <RootFolder>.</RootFolder>
            </Pending>
            <FrozenData isFrozen="false" freeze="false">
                <ArchiveFormat>Auto</ArchiveFormat>
                <ArchiveCompression>Auto</ArchiveCompression>
            </FrozenData>
            </DiskState>
            <Notes></Notes>
        </Mod>
        </ManagedMods>
    "#};
    let resources_txt = "Bundled.ba2,Bundled - Textures.ba2,ModSeparate.ba2,ModSeparateAuto.ba2,ModSeparateFrozen.ba2";

    /*
        dds_default_textures.ba2 -> Data/Bundled - Textures.ba2
        general_default.ba2      -> Data/Bundled.ba2
        dds_default_textures.ba2 -> Data/ModSeparate.ba2
        dds_default_textures.ba2 -> Data/ModSeparateAuto.ba2
        dds_default_textures.ba2 -> Data/ModSeparateFrozen.ba2
        (empty)                  -> Data/SeventySix.esm
        dds_default_textures.ba2 -> FrozenData/{447f7391-da2c-40df-82f3-80af9a8b9304}.ba2
        (unique)                 -> Mods/managed.xml
        pixel.dds                -> Mods/ModBundled/Textures/pixel.dds
        test.txt                 -> Mods/ModBundled/test.txt
        (empty)                  -> Mods/ModLoose/test.dll
        pixel_extracted.dds      -> Mods/ModSeparate/Textures/pixel.dds
        pixel_extracted.dds      -> Mods/ModSeparateAuto/Textures/pixel.dds
        pixel_extracted.dds      -> Mods/ModSeparateFrozen/Textures/pixel.dds
        (unique)                 -> Mods/resources.txt
        (empty)                  -> test.dll
    */

    // Setup folders and standard files:
    fs::create_dir_all(&paths.game_data_path).unwrap();
    fs::create_dir_all(&paths.mods_path).unwrap();
    fs::create_dir_all(&paths.frozen_data_path).unwrap();
    fs_util::write_to_file(paths.game_data_path.join("SeventySix.esm"), "").unwrap();

    // Setup mod meta data:
    fs_util::write_to_file(paths.mods_path.join("managed.xml"), managed_xml).unwrap();
    fs_util::write_to_file(paths.mods_path.join("resources.txt"), resources_txt).unwrap();

    // Setup deployed files:
    fs::copy(
        Path::new("tests/fixtures/dds_default_textures.ba2"),
        paths.game_data_path.join("Bundled - Textures.ba2"),
    )
    .unwrap();
    fs::copy(
        Path::new("tests/fixtures/general_default.ba2"),
        paths.game_data_path.join("Bundled.ba2"),
    )
    .unwrap();
    fs::copy(
        Path::new("tests/fixtures/dds_default_textures.ba2"),
        paths.game_data_path.join("ModSeparate.ba2"),
    )
    .unwrap();
    fs::copy(
        Path::new("tests/fixtures/dds_default_textures.ba2"),
        paths.game_data_path.join("ModSeparateFrozen.ba2"),
    )
    .unwrap();
    fs::copy(
        Path::new("tests/fixtures/dds_default_textures.ba2"),
        paths
            .frozen_data_path
            .join("{447f7391-da2c-40df-82f3-80af9a8b9304}.ba2"),
    )
    .unwrap();
    fs_util::write_to_file(paths.game_path.join("test.dll"), "").unwrap();

    // Setup mod files:
    let mod_bundled_path = paths.mods_path.join("ModBundled");
    let mod_loose_path = paths.mods_path.join("ModLoose");
    let mod_separate_path = paths.mods_path.join("ModSeparate");
    let mod_separate_auto_path = paths.mods_path.join("ModSeparateAuto");
    let mod_separate_frozen_path = paths.mods_path.join("ModSeparateFrozen");

    fs::create_dir_all(&mod_bundled_path).unwrap();
    fs::create_dir_all(&mod_loose_path).unwrap();
    fs::create_dir_all(&mod_separate_path).unwrap();
    fs::create_dir_all(&mod_separate_auto_path).unwrap();
    fs::create_dir_all(&mod_separate_frozen_path).unwrap();

    fs::create_dir_all(mod_bundled_path.join("Textures")).unwrap();
    fs::create_dir_all(mod_separate_path.join("Textures")).unwrap();
    fs::create_dir_all(mod_separate_auto_path.join("Textures")).unwrap();
    fs::create_dir_all(mod_separate_frozen_path.join("Textures")).unwrap();

    fs::copy(
        Path::new("tests/fixtures/pixel.dds"),
        mod_bundled_path.join("Textures").join("pixel.dds"),
    )
    .unwrap();
    fs::copy(
        Path::new("tests/fixtures/test.txt"),
        mod_bundled_path.join("test.txt"),
    )
    .unwrap();
    fs_util::write_to_file(mod_loose_path.join("test.dll"), "").unwrap();
    fs::copy(
        Path::new("tests/fixtures/pixel_extracted.dds"),
        mod_separate_path.join("Textures").join("pixel.dds"),
    )
    .unwrap();
    fs::copy(
        Path::new("tests/fixtures/pixel_extracted.dds"),
        mod_separate_auto_path.join("Textures").join("pixel.dds"),
    )
    .unwrap();
    fs::copy(
        Path::new("tests/fixtures/pixel_extracted.dds"),
        mod_separate_frozen_path.join("Textures").join("pixel.dds"),
    )
    .unwrap();

    paths
}

#[ignore = "Can take up to one minute to complete with wine"]
#[test]
pub fn test_migration_migrate_1() {
    test_utils::setup_stdout_logger();
    let paths = setup_test_case_1();
    let mut ini = Ini::new();
    super::migrate_legacy_managed_mods(&paths.game_path, &paths.mods_path, &mut ini, None).unwrap();

    assert!(paths.mods_path.join("managed.xml").exists());
    assert!(paths.mods_path.join("resources.txt").exists());
    assert!(paths.mods_path.join("mods.json").exists());

    assert!(!get_mods_temp_path(&paths.mods_path).exists());
    assert!(!paths.game_path.join("Mods.old").exists());
    assert!(!paths.frozen_data_path.exists());

    assert!(!paths.game_data_path.join("Bundled.ba2").exists());
    assert!(!paths.game_data_path.join("Bundled - Textures.ba2").exists());
    assert!(!paths.game_path.join("test.dll").exists());

    assert!(paths.mods_path.join("ModBundled").exists());
    assert!(paths.mods_path.join("ModLoose").exists());
    assert!(paths.mods_path.join("ModSeparate").exists());
    assert!(paths.mods_path.join("ModSeparateAuto").exists());
    assert!(paths.mods_path.join("ModSeparateFrozen").exists());
    assert!(
        paths
            .mods_path
            .join("ModBundled")
            .join("Data")
            .join("ModBundled - Textures.ba2")
            .exists()
    );

    let managed = load_mods(&paths.mods_path).unwrap().unwrap();
    assert!(managed.enabled);
    assert_eq!(managed.mods.len(), 5);
    assert!(managed.state.is_empty());
}

#[test]
pub fn test_migration_remove_1() {
    test_utils::setup_stdout_logger();
    let paths = setup_test_case_1();
    let mut ini = Ini::new();
    super::remove_legacy_managed_mods(&paths.game_path, &paths.mods_path, &mut ini, None).unwrap();

    assert!(!paths.mods_path.join("managed.xml").exists());
    assert!(!paths.mods_path.join("resources.txt").exists());
    assert!(!paths.mods_path.join("mods.json").exists());

    assert!(!paths.mods_path.join("ModBundled").exists());
    assert!(!paths.mods_path.join("ModLoose").exists());
    assert!(!paths.mods_path.join("ModSeparate").exists());
    assert!(!paths.mods_path.join("ModSeparateAuto").exists());
    assert!(!paths.mods_path.join("ModSeparateFrozen").exists());

    assert!(!get_mods_temp_path(&paths.mods_path).exists());
    assert!(!paths.game_path.join("Mods.old").exists());
    assert!(!paths.frozen_data_path.exists());

    assert!(!paths.game_data_path.join("Bundled.ba2").exists());
    assert!(!paths.game_data_path.join("Bundled - Textures.ba2").exists());
    assert!(!paths.game_path.join("test.dll").exists());
}

// ============================================================================
// New Test Cases
// ============================================================================

/// Setup for test case: mod that is enabled but not deployed
fn setup_test_enabled_not_deployed() -> TestPaths {
    let paths = TestPaths::new();
    let managed_xml = indoc! {r#"
        <?xml version="1.0" encoding="utf-8"?>
        <ManagedMods enabled="true" nwmode="false">
        <Mod guid="test-guid-1">
            <Title>ModNotDeployed</Title>
            <Folder>ModNotDeployed</Folder>
            <Version>1.0</Version>
            <NexusMods id="-1">
            <URL></URL>
            </NexusMods>
            <DiskState>
            <Current isDeployed="false">
                <InstallationMethod>LooseFiles</InstallationMethod>
                <ArchiveName></ArchiveName>
                <ArchiveFormat>Auto</ArchiveFormat>
                <ArchiveCompression>Auto</ArchiveCompression>
                <RootFolder>.</RootFolder>
                <InstalledLooseFiles />
            </Current>
            <Pending isEnabled="true">
                <InstallationMethod>LooseFiles</InstallationMethod>
                <ArchiveName>untitled.ba2</ArchiveName>
                <ArchiveFormat>Auto</ArchiveFormat>
                <ArchiveCompression>Auto</ArchiveCompression>
                <RootFolder>.</RootFolder>
            </Pending>
            <FrozenData isFrozen="false" freeze="false">
                <ArchiveFormat>Auto</ArchiveFormat>
                <ArchiveCompression>Auto</ArchiveCompression>
            </FrozenData>
            </DiskState>
            <Notes></Notes>
        </Mod>
        </ManagedMods>
    "#};
    let resources_txt = "";

    fs::create_dir_all(&paths.game_data_path).unwrap();
    fs::create_dir_all(&paths.mods_path).unwrap();
    fs::create_dir_all(&paths.frozen_data_path).unwrap();
    fs_util::write_to_file(paths.game_data_path.join("SeventySix.esm"), "").unwrap();

    fs_util::write_to_file(paths.mods_path.join("managed.xml"), managed_xml).unwrap();
    fs_util::write_to_file(paths.mods_path.join("resources.txt"), resources_txt).unwrap();

    let mod_path = paths.mods_path.join("ModNotDeployed");
    fs::create_dir_all(&mod_path).unwrap();
    fs_util::write_to_file(mod_path.join("test.txt"), "test content").unwrap();

    paths
}

#[test]
pub fn test_migration_enabled_not_deployed() {
    test_utils::setup_stdout_logger();
    let paths = setup_test_enabled_not_deployed();
    let mut ini = Ini::new();
    super::migrate_legacy_managed_mods(&paths.game_path, &paths.mods_path, &mut ini, None).unwrap();

    assert!(paths.mods_path.join("managed.xml").exists());
    assert!(paths.mods_path.join("resources.txt").exists());
    assert!(paths.mods_path.join("mods.json").exists());

    assert!(!get_mods_temp_path(&paths.mods_path).exists());
    assert!(!paths.game_path.join("Mods.old").exists());
    assert!(!paths.frozen_data_path.exists());

    assert!(paths.mods_path.join("ModNotDeployed").exists());
    assert!(
        paths
            .mods_path
            .join("ModNotDeployed")
            .join("test.txt")
            .exists()
    );

    let managed = load_mods(&paths.mods_path).unwrap().unwrap();
    assert!(managed.enabled);
    assert_eq!(managed.mods.len(), 1);
    assert!(managed.state.is_empty());
}

/// Setup for test case: mod with empty mod folder for each installation method
fn setup_test_empty_mod_folders() -> TestPaths {
    let paths = TestPaths::new();
    let managed_xml = indoc! {r#"
        <?xml version="1.0" encoding="utf-8"?>
        <ManagedMods enabled="true" nwmode="false">
        <Mod guid="test-guid-loose">
            <Title>ModLooseEmpty</Title>
            <Folder>ModLooseEmpty</Folder>
            <Version>1.0</Version>
            <NexusMods id="-1">
            <URL></URL>
            </NexusMods>
            <DiskState>
            <Current isDeployed="true">
                <InstallationMethod>LooseFiles</InstallationMethod>
                <ArchiveName></ArchiveName>
                <ArchiveFormat>Auto</ArchiveFormat>
                <ArchiveCompression>Auto</ArchiveCompression>
                <RootFolder>.</RootFolder>
                <InstalledLooseFiles />
            </Current>
            <Pending isEnabled="true">
                <InstallationMethod>LooseFiles</InstallationMethod>
                <ArchiveName>untitled.ba2</ArchiveName>
                <ArchiveFormat>Auto</ArchiveFormat>
                <ArchiveCompression>Auto</ArchiveCompression>
                <RootFolder>.</RootFolder>
            </Pending>
            <FrozenData isFrozen="false" freeze="false">
                <ArchiveFormat>Auto</ArchiveFormat>
                <ArchiveCompression>Auto</ArchiveCompression>
            </FrozenData>
            </DiskState>
            <Notes></Notes>
        </Mod>
        <Mod guid="test-guid-bundled">
            <Title>ModBundledEmpty</Title>
            <Folder>ModBundledEmpty</Folder>
            <Version>1.0</Version>
            <NexusMods id="-1">
            <URL></URL>
            </NexusMods>
            <DiskState>
            <Current isDeployed="true">
                <InstallationMethod>BundledBA2</InstallationMethod>
                <ArchiveName></ArchiveName>
                <ArchiveFormat>Auto</ArchiveFormat>
                <ArchiveCompression>Auto</ArchiveCompression>
                <RootFolder>.</RootFolder>
                <InstalledLooseFiles />
            </Current>
            <Pending isEnabled="true">
                <InstallationMethod>BundledBA2</InstallationMethod>
                <ArchiveName>untitled.ba2</ArchiveName>
                <ArchiveFormat>Auto</ArchiveFormat>
                <ArchiveCompression>Auto</ArchiveCompression>
                <RootFolder>.</RootFolder>
            </Pending>
            <FrozenData isFrozen="false" freeze="false">
                <ArchiveFormat>Auto</ArchiveFormat>
                <ArchiveCompression>Auto</ArchiveCompression>
            </FrozenData>
            </DiskState>
            <Notes></Notes>
        </Mod>
        <Mod guid="test-guid-separate">
            <Title>ModSeparateEmpty</Title>
            <Folder>ModSeparateEmpty</Folder>
            <Version>1.0</Version>
            <NexusMods id="-1">
            <URL></URL>
            </NexusMods>
            <DiskState>
            <Current isDeployed="true">
                <InstallationMethod>SeparateBA2</InstallationMethod>
                <ArchiveName>ModSeparateEmpty.ba2</ArchiveName>
                <ArchiveFormat>Textures</ArchiveFormat>
                <ArchiveCompression>Compressed</ArchiveCompression>
                <RootFolder>.</RootFolder>
                <InstalledLooseFiles />
            </Current>
            <Pending isEnabled="true">
                <InstallationMethod>SeparateBA2</InstallationMethod>
                <ArchiveName>ModSeparateEmpty.ba2</ArchiveName>
                <ArchiveFormat>Textures</ArchiveFormat>
                <ArchiveCompression>Compressed</ArchiveCompression>
                <RootFolder>.</RootFolder>
            </Pending>
            <FrozenData isFrozen="false" freeze="false">
                <ArchiveFormat>Textures</ArchiveFormat>
                <ArchiveCompression>Compressed</ArchiveCompression>
            </FrozenData>
            </DiskState>
            <Notes></Notes>
        </Mod>
        <Mod guid="test-guid-separate-auto">
            <Title>ModSeparateAutoEmpty</Title>
            <Folder>ModSeparateAutoEmpty</Folder>
            <Version>1.0</Version>
            <NexusMods id="-1">
            <URL></URL>
            </NexusMods>
            <DiskState>
            <Current isDeployed="true">
                <InstallationMethod>SeparateBA2</InstallationMethod>
                <ArchiveName>ModSeparateAutoEmpty.ba2</ArchiveName>
                <ArchiveFormat>Auto</ArchiveFormat>
                <ArchiveCompression>Auto</ArchiveCompression>
                <RootFolder>.</RootFolder>
                <InstalledLooseFiles />
            </Current>
            <Pending isEnabled="true">
                <InstallationMethod>SeparateBA2</InstallationMethod>
                <ArchiveName>ModSeparateAutoEmpty.ba2</ArchiveName>
                <ArchiveFormat>Auto</ArchiveFormat>
                <ArchiveCompression>Auto</ArchiveCompression>
                <RootFolder>.</RootFolder>
            </Pending>
            <FrozenData isFrozen="false" freeze="false">
                <ArchiveFormat>Auto</ArchiveFormat>
                <ArchiveCompression>Auto</ArchiveCompression>
            </FrozenData>
            </DiskState>
            <Notes></Notes>
        </Mod>
        </ManagedMods>
    "#};
    let resources_txt = "";

    fs::create_dir_all(&paths.game_data_path).unwrap();
    fs::create_dir_all(&paths.mods_path).unwrap();
    fs::create_dir_all(&paths.frozen_data_path).unwrap();
    fs_util::write_to_file(paths.game_data_path.join("SeventySix.esm"), "").unwrap();

    fs_util::write_to_file(paths.mods_path.join("managed.xml"), managed_xml).unwrap();
    fs_util::write_to_file(paths.mods_path.join("resources.txt"), resources_txt).unwrap();

    let mod_loose_path = paths.mods_path.join("ModLooseEmpty");
    let mod_bundled_path = paths.mods_path.join("ModBundledEmpty");
    let mod_separate_path = paths.mods_path.join("ModSeparateEmpty");
    let mod_separate_auto_path = paths.mods_path.join("ModSeparateAutoEmpty");

    fs::create_dir_all(&mod_loose_path).unwrap();
    fs::create_dir_all(&mod_bundled_path).unwrap();
    fs::create_dir_all(&mod_separate_path).unwrap();
    fs::create_dir_all(&mod_separate_auto_path).unwrap();

    paths
}

#[test]
pub fn test_migration_empty_mod_folders() {
    test_utils::setup_stdout_logger();
    let paths = setup_test_empty_mod_folders();
    let mut ini = Ini::new();
    let result =
        super::migrate_legacy_managed_mods(&paths.game_path, &paths.mods_path, &mut ini, None);
    assert!(
        result.is_ok(),
        "Migration should not error with empty mod folders"
    );

    assert!(paths.mods_path.join("managed.xml").exists());
    assert!(paths.mods_path.join("resources.txt").exists());
    assert!(paths.mods_path.join("mods.json").exists());

    assert!(!get_mods_temp_path(&paths.mods_path).exists());
    assert!(!paths.game_path.join("Mods.old").exists());
    assert!(!paths.frozen_data_path.exists());

    assert!(
        paths.mods_path.join("ModLooseEmpty").exists(),
        "Empty LooseFiles mod folder should be created"
    );
    assert!(
        paths.mods_path.join("ModBundledEmpty").exists(),
        "Empty BundledBA2 mod folder should be created"
    );
    assert!(
        paths.mods_path.join("ModSeparateEmpty").exists(),
        "Empty SeparateBA2 mod folder should be created"
    );
    assert!(
        paths.mods_path.join("ModSeparateAutoEmpty").exists(),
        "Empty SeparateBA2 (Auto) mod folder should be created"
    );

    let managed = load_mods(&paths.mods_path).unwrap().unwrap();
    assert!(managed.enabled);
    assert_eq!(managed.mods.len(), 4);
}

/// Setup for test case: mod without mod folder for each installation method
fn setup_test_missing_mod_folders() -> TestPaths {
    let paths = TestPaths::new();
    let managed_xml = indoc! {r#"
        <?xml version="1.0" encoding="utf-8"?>
        <ManagedMods enabled="true" nwmode="false">
        <Mod guid="test-guid-loose-missing">
            <Title>ModLooseMissing</Title>
            <Folder>ModLooseMissing</Folder>
            <Version>1.0</Version>
            <NexusMods id="-1">
            <URL></URL>
            </NexusMods>
            <DiskState>
            <Current isDeployed="true">
                <InstallationMethod>LooseFiles</InstallationMethod>
                <ArchiveName></ArchiveName>
                <ArchiveFormat>Auto</ArchiveFormat>
                <ArchiveCompression>Auto</ArchiveCompression>
                <RootFolder>.</RootFolder>
                <InstalledLooseFiles />
            </Current>
            <Pending isEnabled="true">
                <InstallationMethod>LooseFiles</InstallationMethod>
                <ArchiveName>untitled.ba2</ArchiveName>
                <ArchiveFormat>Auto</ArchiveFormat>
                <ArchiveCompression>Auto</ArchiveCompression>
                <RootFolder>.</RootFolder>
            </Pending>
            <FrozenData isFrozen="false" freeze="false">
                <ArchiveFormat>Auto</ArchiveFormat>
                <ArchiveCompression>Auto</ArchiveCompression>
            </FrozenData>
            </DiskState>
            <Notes></Notes>
        </Mod>
        <Mod guid="test-guid-bundled-missing">
            <Title>ModBundledMissing</Title>
            <Folder>ModBundledMissing</Folder>
            <Version>1.0</Version>
            <NexusMods id="-1">
            <URL></URL>
            </NexusMods>
            <DiskState>
            <Current isDeployed="true">
                <InstallationMethod>BundledBA2</InstallationMethod>
                <ArchiveName></ArchiveName>
                <ArchiveFormat>Auto</ArchiveFormat>
                <ArchiveCompression>Auto</ArchiveCompression>
                <RootFolder>.</RootFolder>
                <InstalledLooseFiles />
            </Current>
            <Pending isEnabled="true">
                <InstallationMethod>BundledBA2</InstallationMethod>
                <ArchiveName>untitled.ba2</ArchiveName>
                <ArchiveFormat>Auto</ArchiveFormat>
                <ArchiveCompression>Auto</ArchiveCompression>
                <RootFolder>.</RootFolder>
            </Pending>
            <FrozenData isFrozen="false" freeze="false">
                <ArchiveFormat>Auto</ArchiveFormat>
                <ArchiveCompression>Auto</ArchiveCompression>
            </FrozenData>
            </DiskState>
            <Notes></Notes>
        </Mod>
        <Mod guid="test-guid-separate-missing">
            <Title>ModSeparateMissing</Title>
            <Folder>ModSeparateMissing</Folder>
            <Version>1.0</Version>
            <NexusMods id="-1">
            <URL></URL>
            </NexusMods>
            <DiskState>
            <Current isDeployed="true">
                <InstallationMethod>SeparateBA2</InstallationMethod>
                <ArchiveName>ModSeparateMissing.ba2</ArchiveName>
                <ArchiveFormat>Textures</ArchiveFormat>
                <ArchiveCompression>Compressed</ArchiveCompression>
                <RootFolder>.</RootFolder>
                <InstalledLooseFiles />
            </Current>
            <Pending isEnabled="true">
                <InstallationMethod>SeparateBA2</InstallationMethod>
                <ArchiveName>ModSeparateMissing.ba2</ArchiveName>
                <ArchiveFormat>Textures</ArchiveFormat>
                <ArchiveCompression>Compressed</ArchiveCompression>
                <RootFolder>.</RootFolder>
            </Pending>
            <FrozenData isFrozen="false" freeze="false">
                <ArchiveFormat>Textures</ArchiveFormat>
                <ArchiveCompression>Compressed</ArchiveCompression>
            </FrozenData>
            </DiskState>
            <Notes></Notes>
        </Mod>
        </ManagedMods>
    "#};
    let resources_txt = "";

    fs::create_dir_all(&paths.game_data_path).unwrap();
    fs::create_dir_all(&paths.mods_path).unwrap();
    fs::create_dir_all(&paths.frozen_data_path).unwrap();
    fs_util::write_to_file(paths.game_data_path.join("SeventySix.esm"), "").unwrap();

    fs_util::write_to_file(paths.mods_path.join("managed.xml"), managed_xml).unwrap();
    fs_util::write_to_file(paths.mods_path.join("resources.txt"), resources_txt).unwrap();

    paths
}

#[test]
pub fn test_migration_missing_mod_folders() {
    test_utils::setup_stdout_logger();
    let paths = setup_test_missing_mod_folders();
    let mut ini = Ini::new();
    let result =
        super::migrate_legacy_managed_mods(&paths.game_path, &paths.mods_path, &mut ini, None);
    assert!(
        result.is_ok(),
        "Migration should not error with missing mod folders"
    );

    assert!(paths.mods_path.join("managed.xml").exists());
    assert!(paths.mods_path.join("resources.txt").exists());
    assert!(paths.mods_path.join("mods.json").exists());

    assert!(!get_mods_temp_path(&paths.mods_path).exists());
    assert!(!paths.game_path.join("Mods.old").exists());
    assert!(!paths.frozen_data_path.exists());

    assert!(
        paths.mods_path.join("ModLooseMissing").exists(),
        "Missing LooseFiles mod folder should be created"
    );
    assert!(
        paths.mods_path.join("ModBundledMissing").exists(),
        "Missing BundledBA2 mod folder should be created"
    );
    assert!(
        paths.mods_path.join("ModSeparateMissing").exists(),
        "Missing SeparateBA2 mod folder should be created"
    );

    let managed = load_mods(&paths.mods_path).unwrap().unwrap();
    assert!(managed.enabled);
    assert_eq!(managed.mods.len(), 3);
}

/// Setup for test case: *.old restore behavior
fn setup_test_old_restore() -> TestPaths {
    let paths = TestPaths::new();
    let managed_xml = indoc! {r#"
        <?xml version="1.0" encoding="utf-8"?>
        <ManagedMods enabled="true" nwmode="false">
        <Mod guid="test-guid-old">
            <Title>ModWithOldFiles</Title>
            <Folder>ModWithOldFiles</Folder>
            <Version>1.0</Version>
            <NexusMods id="-1">
            <URL></URL>
            </NexusMods>
            <DiskState>
            <Current isDeployed="true">
                <InstallationMethod>LooseFiles</InstallationMethod>
                <ArchiveName></ArchiveName>
                <ArchiveFormat>Auto</ArchiveFormat>
                <ArchiveCompression>Auto</ArchiveCompression>
                <RootFolder>.</RootFolder>
                <InstalledLooseFiles>
                <File path=".\test.dll" />
                <File path=".\config.ini" />
                </InstalledLooseFiles>
            </Current>
            <Pending isEnabled="true">
                <InstallationMethod>LooseFiles</InstallationMethod>
                <ArchiveName>untitled.ba2</ArchiveName>
                <ArchiveFormat>Auto</ArchiveFormat>
                <ArchiveCompression>Auto</ArchiveCompression>
                <RootFolder>.</RootFolder>
            </Pending>
            <FrozenData isFrozen="false" freeze="false">
                <ArchiveFormat>Auto</ArchiveFormat>
                <ArchiveCompression>Auto</ArchiveCompression>
            </FrozenData>
            </DiskState>
            <Notes></Notes>
        </Mod>
        </ManagedMods>
    "#};
    let resources_txt = "";

    fs::create_dir_all(&paths.game_data_path).unwrap();
    fs::create_dir_all(&paths.mods_path).unwrap();
    fs::create_dir_all(&paths.frozen_data_path).unwrap();
    fs_util::write_to_file(paths.game_data_path.join("SeventySix.esm"), "").unwrap();

    fs_util::write_to_file(paths.mods_path.join("managed.xml"), managed_xml).unwrap();
    fs_util::write_to_file(paths.mods_path.join("resources.txt"), resources_txt).unwrap();

    let mod_path = paths.mods_path.join("ModWithOldFiles");
    fs::create_dir_all(&mod_path).unwrap();

    let game_test_dll_path = paths.game_path.join("test.dll");
    let game_config_path = paths.game_path.join("config.ini");
    let game_test_dll_old_path = paths.game_path.join("test.dll.old");
    let game_config_old_path = paths.game_path.join("config.ini.old");

    fs_util::write_to_file(&game_test_dll_path, "new content").unwrap();
    fs_util::write_to_file(&game_config_path, "new config").unwrap();
    fs_util::write_to_file(&game_test_dll_old_path, "old backup content").unwrap();
    fs_util::write_to_file(&game_config_old_path, "old backup config").unwrap();

    paths
}

#[test]
pub fn test_old_restore_behavior() {
    test_utils::setup_stdout_logger();
    let paths = setup_test_old_restore();
    let mut ini = Ini::new();
    super::remove_legacy_managed_mods(&paths.game_path, &paths.mods_path, &mut ini, None).unwrap();

    let game_test_dll_path = paths.game_path.join("test.dll");
    let game_config_path = paths.game_path.join("config.ini");
    let game_test_dll_old_path = paths.game_path.join("test.dll.old");
    let game_config_old_path = paths.game_path.join("config.ini.old");

    assert!(
        !game_test_dll_old_path.exists(),
        ".old file should be moved back and no longer exist"
    );
    assert!(
        !game_config_old_path.exists(),
        ".old file should be moved back and no longer exist"
    );

    assert!(game_test_dll_path.exists(), "Old file should be restored");
    assert!(game_config_path.exists(), "Old file should be restored");

    assert_eq!(
        fs::read_to_string(&game_test_dll_path).unwrap(),
        "old backup content"
    );
    assert_eq!(
        fs::read_to_string(&game_config_path).unwrap(),
        "old backup config"
    );
}

/// Setup for test case: mod with nested loose files
fn setup_test_nested_loose_files() -> TestPaths {
    let paths = TestPaths::new();
    let managed_xml = indoc! {r#"
        <?xml version="1.0" encoding="utf-8"?>
        <ManagedMods enabled="true" nwmode="false">
        <Mod guid="test-guid-nested">
            <Title>ModNestedLoose</Title>
            <Folder>ModNestedLoose</Folder>
            <Version>1.0</Version>
            <NexusMods id="-1">
            <URL></URL>
            </NexusMods>
            <DiskState>
            <Current isDeployed="true">
                <InstallationMethod>LooseFiles</InstallationMethod>
                <ArchiveName></ArchiveName>
                <ArchiveFormat>Auto</ArchiveFormat>
                <ArchiveCompression>Auto</ArchiveCompression>
                <RootFolder>.</RootFolder>
                <InstalledLooseFiles />
            </Current>
            <Pending isEnabled="true">
                <InstallationMethod>LooseFiles</InstallationMethod>
                <ArchiveName>untitled.ba2</ArchiveName>
                <ArchiveFormat>Auto</ArchiveFormat>
                <ArchiveCompression>Auto</ArchiveCompression>
                <RootFolder>.</RootFolder>
            </Pending>
            <FrozenData isFrozen="false" freeze="false">
                <ArchiveFormat>Auto</ArchiveFormat>
                <ArchiveCompression>Auto</ArchiveCompression>
            </FrozenData>
            </DiskState>
            <Notes></Notes>
        </Mod>
        </ManagedMods>
    "#};
    let resources_txt = "";

    fs::create_dir_all(&paths.game_data_path).unwrap();
    fs::create_dir_all(&paths.mods_path).unwrap();
    fs::create_dir_all(&paths.frozen_data_path).unwrap();
    fs_util::write_to_file(paths.game_data_path.join("SeventySix.esm"), "").unwrap();

    fs_util::write_to_file(paths.mods_path.join("managed.xml"), managed_xml).unwrap();
    fs_util::write_to_file(paths.mods_path.join("resources.txt"), resources_txt).unwrap();

    let mod_path = paths.mods_path.join("ModNestedLoose");
    let textures_path = mod_path.join("Textures");
    let meshes_path = mod_path.join("Meshes");
    let meshes_sub_path = meshes_path.join("Subfolder");

    fs::create_dir_all(&textures_path).unwrap();
    fs::create_dir_all(&meshes_sub_path).unwrap();

    fs::copy(
        Path::new("tests/fixtures/pixel.dds"),
        textures_path.join("pixel.dds"),
    )
    .unwrap();
    fs_util::write_to_file(meshes_sub_path.join("mesh.nif"), "mesh data").unwrap();

    paths
}

#[test]
pub fn test_migration_nested_loose_files() {
    test_utils::setup_stdout_logger();
    let paths = setup_test_nested_loose_files();
    let mut ini = Ini::new();
    let result =
        super::migrate_legacy_managed_mods(&paths.game_path, &paths.mods_path, &mut ini, None);
    assert!(result.is_ok(), "Migration should handle nested loose files");

    assert!(paths.mods_path.join("managed.xml").exists());
    assert!(paths.mods_path.join("resources.txt").exists());
    assert!(paths.mods_path.join("mods.json").exists());

    assert!(!get_mods_temp_path(&paths.mods_path).exists());
    assert!(!paths.game_path.join("Mods.old").exists());
    assert!(!paths.frozen_data_path.exists());

    let mod_path = paths.mods_path.join("ModNestedLoose");
    assert!(mod_path.exists());
    assert!(mod_path.join("Textures").join("pixel.dds").exists());
    assert!(
        mod_path
            .join("Meshes")
            .join("Subfolder")
            .join("mesh.nif")
            .exists()
    );

    let managed = load_mods(&paths.mods_path).unwrap().unwrap();
    assert!(managed.enabled);
    assert_eq!(managed.mods.len(), 1);
}

/// Setup for test case: existing and filled Mods/_tmp folder
fn setup_test_existing_tmp_folder() -> TestPaths {
    let paths = TestPaths::new();
    let managed_xml = indoc! {r#"
        <?xml version="1.0" encoding="utf-8"?>
        <ManagedMods enabled="true" nwmode="false">
        <Mod guid="test-guid-tmp">
            <Title>ModWithTmp</Title>
            <Folder>ModWithTmp</Folder>
            <Version>1.0</Version>
            <NexusMods id="-1">
            <URL></URL>
            </NexusMods>
            <DiskState>
            <Current isDeployed="true">
                <InstallationMethod>BundledBA2</InstallationMethod>
                <ArchiveName></ArchiveName>
                <ArchiveFormat>Auto</ArchiveFormat>
                <ArchiveCompression>Auto</ArchiveCompression>
                <RootFolder>.</RootFolder>
                <InstalledLooseFiles />
            </Current>
            <Pending isEnabled="true">
                <InstallationMethod>BundledBA2</InstallationMethod>
                <ArchiveName>untitled.ba2</ArchiveName>
                <ArchiveFormat>Auto</ArchiveFormat>
                <ArchiveCompression>Auto</ArchiveCompression>
                <RootFolder>.</RootFolder>
            </Pending>
            <FrozenData isFrozen="false" freeze="false">
                <ArchiveFormat>Auto</ArchiveFormat>
                <ArchiveCompression>Auto</ArchiveCompression>
            </FrozenData>
            </DiskState>
            <Notes></Notes>
        </Mod>
        </ManagedMods>
    "#};
    let resources_txt = "";

    fs::create_dir_all(&paths.game_data_path).unwrap();
    fs::create_dir_all(&paths.mods_path).unwrap();
    fs::create_dir_all(&paths.frozen_data_path).unwrap();
    fs_util::write_to_file(paths.game_data_path.join("SeventySix.esm"), "").unwrap();

    fs_util::write_to_file(paths.mods_path.join("managed.xml"), managed_xml).unwrap();
    fs_util::write_to_file(paths.mods_path.join("resources.txt"), resources_txt).unwrap();

    let mod_path = paths.mods_path.join("ModWithTmp");
    let tmp_path = get_mods_temp_path(&paths.mods_path);

    fs::create_dir_all(&mod_path).unwrap();
    fs::create_dir_all(&tmp_path).unwrap();
    fs_util::write_to_file(tmp_path.join("temp_file.txt"), "temp data").unwrap();
    fs::create_dir_all(tmp_path.join("temp_subdir")).unwrap();
    fs_util::write_to_file(
        tmp_path.join("temp_subdir").join("nested.txt"),
        "nested temp",
    )
    .unwrap();

    paths
}

#[test]
pub fn test_migration_existing_tmp_folder() {
    test_utils::setup_stdout_logger();
    let paths = setup_test_existing_tmp_folder();
    let tmp_path = get_mods_temp_path(&paths.mods_path);

    assert!(
        tmp_path.exists(),
        "Temp folder should exist before migration"
    );
    assert!(
        tmp_path.join("temp_file.txt").exists(),
        "Temp file should exist before migration"
    );

    let mut ini = Ini::new();
    let result =
        super::migrate_legacy_managed_mods(&paths.game_path, &paths.mods_path, &mut ini, None);
    assert!(
        result.is_ok(),
        "Migration should handle existing _tmp folder"
    );

    assert!(paths.mods_path.join("managed.xml").exists());
    assert!(paths.mods_path.join("resources.txt").exists());
    assert!(paths.mods_path.join("mods.json").exists());

    assert!(
        !get_mods_temp_path(&paths.mods_path).exists(),
        "Old _tmp folder should be removed"
    );
    assert!(!paths.game_path.join("Mods.old").exists());
    assert!(!paths.frozen_data_path.exists());

    let managed = load_mods(&paths.mods_path).unwrap().unwrap();
    assert!(managed.enabled);
    assert_eq!(managed.mods.len(), 1);
}
