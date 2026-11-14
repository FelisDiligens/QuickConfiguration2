#![cfg(test)]

use std::fs;
use std::path::{Path, PathBuf};

use indoc::indoc;
use ini::Ini;
use tempfile::TempDir;

use crate::features::mods::{get_mods_temp_path, load_mods};
use crate::utils::ini::IniAccessors;
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
        let tmp_dir = TempDir::new().unwrap();
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
        <Mod guid="test-guid-frozen-missing">
            <Title>ModFrozenMissing</Title>
            <Folder>ModFrozenMissing</Folder>
            <Version>1.0</Version>
            <NexusMods id="-1">
            <URL></URL>
            </NexusMods>
            <DiskState>
            <Current isDeployed="true">
                <InstallationMethod>SeparateBA2</InstallationMethod>
                <ArchiveName>ModFrozenMissing.ba2</ArchiveName>
                <ArchiveFormat>General</ArchiveFormat>
                <ArchiveCompression>Compressed</ArchiveCompression>
                <RootFolder>.</RootFolder>
                <InstalledLooseFiles />
            </Current>
            <Pending isEnabled="true">
                <InstallationMethod>SeparateBA2</InstallationMethod>
                <ArchiveName>ModFrozenMissing.ba2</ArchiveName>
                <ArchiveFormat>General</ArchiveFormat>
                <ArchiveCompression>Compressed</ArchiveCompression>
                <RootFolder>Data</RootFolder>
            </Pending>
            <FrozenData isFrozen="true" freeze="true">
                <ArchiveFormat>General</ArchiveFormat>
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

    let mod_loose_path = paths.mods_path.join("ModLooseEmpty");
    let mod_bundled_path = paths.mods_path.join("ModBundledEmpty");
    let mod_separate_path = paths.mods_path.join("ModSeparateEmpty");
    let mod_separate_auto_path = paths.mods_path.join("ModSeparateAutoEmpty");

    fs::create_dir_all(&mod_loose_path).unwrap();
    fs::create_dir_all(&mod_bundled_path).unwrap();
    fs::create_dir_all(&mod_separate_path).unwrap();
    fs::create_dir_all(&mod_separate_auto_path).unwrap();

    fs::copy(
        Path::new("tests/fixtures/general_default.ba2"),
        paths
            .frozen_data_path
            .join("{test-guid-frozen-missing}.ba2"),
    )
    .unwrap();
    fs::copy(
        Path::new("tests/fixtures/general_default.ba2"),
        paths.game_data_path.join("ModFrozenMissing.ba2"),
    )
    .unwrap();

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
    assert!(
        paths
            .mods_path
            .join("ModFrozenMissing")
            .join("ModFrozenMissing.ba2")
            .exists(),
        "Frozen SeparateBA2 with missing mod folder should get the frozen archive moved into the new mod folder"
    );
    assert!(!paths.game_data_path.join("ModFrozenMissing.ba2").exists());

    let managed = load_mods(&paths.mods_path).unwrap().unwrap();
    assert!(managed.enabled);
    assert_eq!(managed.mods.len(), 5);
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

fn setup_test_case_2() -> TestPaths {
    let paths = TestPaths::new();
    let managed_xml = indoc! {r#"
      <?xml version="1.0" encoding="utf-8"?>
      <ManagedMods enabled="true" nwmode="false">
        <Mod guid="3283cd91-d01f-4ca7-a386-854abc3ea133">
          <Title>ModFrozenSeparateDeployed</Title>
          <Folder>ModFrozenSeparateDeployed</Folder>
          <Version>1.0</Version>
          <NexusMods id="-1">
            <URL></URL>
          </NexusMods>
          <DiskState>
            <Current isDeployed="true">
              <InstallationMethod>SeparateBA2</InstallationMethod>
              <ArchiveName>ModFrozenSeparateDeployed.ba2</ArchiveName>
              <ArchiveFormat>General</ArchiveFormat>
              <ArchiveCompression>Compressed</ArchiveCompression>
              <RootFolder>.</RootFolder>
              <InstalledLooseFiles />
            </Current>
            <Pending isEnabled="true">
              <InstallationMethod>SeparateBA2</InstallationMethod>
              <ArchiveName>ModFrozenSeparateDeployed.ba2</ArchiveName>
              <ArchiveFormat>General</ArchiveFormat>
              <ArchiveCompression>Compressed</ArchiveCompression>
              <RootFolder>Data</RootFolder>
            </Pending>
            <FrozenData isFrozen="true" freeze="true">
              <ArchiveFormat>General</ArchiveFormat>
              <ArchiveCompression>Compressed</ArchiveCompression>
            </FrozenData>
          </DiskState>
          <Notes></Notes>
        </Mod>
        <Mod guid="787f1467-e67c-4dab-afa9-76c92f555aa8">
          <Title>ModFrozenSeparateDisabled</Title>
          <Folder>ModFrozenSeparateDisabled</Folder>
          <Version>1.0</Version>
          <NexusMods id="-1">
            <URL></URL>
          </NexusMods>
          <DiskState>
            <Current isDeployed="false">
              <InstallationMethod>SeparateBA2</InstallationMethod>
              <ArchiveName>ModFrozenSeparateDisabled.ba2</ArchiveName>
              <ArchiveFormat>General</ArchiveFormat>
              <ArchiveCompression>Compressed</ArchiveCompression>
              <RootFolder>.</RootFolder>
              <InstalledLooseFiles />
            </Current>
            <Pending isEnabled="false">
              <InstallationMethod>SeparateBA2</InstallationMethod>
              <ArchiveName>ModFrozenSeparateDisabled.ba2</ArchiveName>
              <ArchiveFormat>General</ArchiveFormat>
              <ArchiveCompression>Compressed</ArchiveCompression>
              <RootFolder>Data</RootFolder>
            </Pending>
            <FrozenData isFrozen="true" freeze="true">
              <ArchiveFormat>General</ArchiveFormat>
              <ArchiveCompression>Compressed</ArchiveCompression>
            </FrozenData>
          </DiskState>
          <Notes></Notes>
        </Mod>
        <Mod guid="4b3811e0-1e42-4cee-a2b0-dc2f905aeb78">
          <Title>ModFreezeSeparateDisabled</Title>
          <Folder>ModFreezeSeparateDisabled</Folder>
          <Version>1.0</Version>
          <NexusMods id="-1">
            <URL></URL>
          </NexusMods>
          <DiskState>
            <Current isDeployed="false">
              <InstallationMethod>LooseFiles</InstallationMethod>
              <ArchiveName />
              <ArchiveFormat>Auto</ArchiveFormat>
              <ArchiveCompression>Auto</ArchiveCompression>
              <RootFolder>.</RootFolder>
              <InstalledLooseFiles />
            </Current>
            <Pending isEnabled="false">
              <InstallationMethod>SeparateBA2</InstallationMethod>
              <ArchiveName>ModFreezeSeparateDisabled.ba2</ArchiveName>
              <ArchiveFormat>General</ArchiveFormat>
              <ArchiveCompression>Compressed</ArchiveCompression>
              <RootFolder>Data</RootFolder>
            </Pending>
            <FrozenData isFrozen="false" freeze="true">
              <ArchiveFormat>Auto</ArchiveFormat>
              <ArchiveCompression>Auto</ArchiveCompression>
            </FrozenData>
          </DiskState>
          <Notes></Notes>
        </Mod>
        <Mod guid="5f42d646-879e-4325-96b4-474c5a6d2dd7">
          <Title>ModSeparateDisabled</Title>
          <Folder>ModSeparateDisabled</Folder>
          <Version>1.0</Version>
          <NexusMods id="-1">
            <URL></URL>
          </NexusMods>
          <DiskState>
            <Current isDeployed="false">
              <InstallationMethod>LooseFiles</InstallationMethod>
              <ArchiveName />
              <ArchiveFormat>Auto</ArchiveFormat>
              <ArchiveCompression>Auto</ArchiveCompression>
              <RootFolder>.</RootFolder>
              <InstalledLooseFiles />
            </Current>
            <Pending isEnabled="false">
              <InstallationMethod>SeparateBA2</InstallationMethod>
              <ArchiveName>ModSeparateDisabled.ba2</ArchiveName>
              <ArchiveFormat>General</ArchiveFormat>
              <ArchiveCompression>Compressed</ArchiveCompression>
              <RootFolder>Data</RootFolder>
            </Pending>
            <FrozenData isFrozen="false" freeze="false">
              <ArchiveFormat>Auto</ArchiveFormat>
              <ArchiveCompression>Auto</ArchiveCompression>
            </FrozenData>
          </DiskState>
          <Notes></Notes>
        </Mod>
        <Mod guid="5cfbb9d3-f01d-46db-8078-32481707c522">
          <Title>ModSeparateDeployed</Title>
          <Folder>ModSeparateDeployed</Folder>
          <Version>1.0</Version>
          <NexusMods id="-1">
            <URL></URL>
          </NexusMods>
          <DiskState>
            <Current isDeployed="true">
              <InstallationMethod>SeparateBA2</InstallationMethod>
              <ArchiveName>ModSeparateDeployed.ba2</ArchiveName>
              <ArchiveFormat>General</ArchiveFormat>
              <ArchiveCompression>Compressed</ArchiveCompression>
              <RootFolder>.</RootFolder>
              <InstalledLooseFiles />
            </Current>
            <Pending isEnabled="true">
              <InstallationMethod>SeparateBA2</InstallationMethod>
              <ArchiveName>ModSeparateDeployed.ba2</ArchiveName>
              <ArchiveFormat>General</ArchiveFormat>
              <ArchiveCompression>Compressed</ArchiveCompression>
              <RootFolder>Data</RootFolder>
            </Pending>
            <FrozenData isFrozen="false" freeze="false">
              <ArchiveFormat>Auto</ArchiveFormat>
              <ArchiveCompression>Auto</ArchiveCompression>
            </FrozenData>
          </DiskState>
          <Notes></Notes>
        </Mod>
        <Mod guid="14134a25-db6b-4e18-ab1c-49935da792bd">
          <Title>ModBundledDeployed</Title>
          <Folder>ModBundledDeployed</Folder>
          <Version>1.0</Version>
          <NexusMods id="-1">
            <URL></URL>
          </NexusMods>
          <DiskState>
            <Current isDeployed="true">
              <InstallationMethod>BundledBA2</InstallationMethod>
              <ArchiveName />
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
        <Mod guid="789e276a-4be7-4722-af61-00eee3ddc620">
          <Title>ModBundledDisabled</Title>
          <Folder>ModBundledDisabled</Folder>
          <Version>1.0</Version>
          <NexusMods id="-1">
            <URL></URL>
          </NexusMods>
          <DiskState>
            <Current isDeployed="false">
              <InstallationMethod>LooseFiles</InstallationMethod>
              <ArchiveName />
              <ArchiveFormat>Auto</ArchiveFormat>
              <ArchiveCompression>Auto</ArchiveCompression>
              <RootFolder>.</RootFolder>
              <InstalledLooseFiles />
            </Current>
            <Pending isEnabled="false">
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
        <Mod guid="828a67d7-480f-4f46-9ac0-435b3b397383">
          <Title>ModLooseFilesDeployed</Title>
          <Folder>ModLooseFilesDeployed</Folder>
          <Version>1.0</Version>
          <NexusMods id="-1">
            <URL></URL>
          </NexusMods>
          <DiskState>
            <Current isDeployed="true">
              <InstallationMethod>LooseFiles</InstallationMethod>
              <ArchiveName />
              <ArchiveFormat>Auto</ArchiveFormat>
              <ArchiveCompression>Auto</ArchiveCompression>
              <RootFolder>.</RootFolder>
              <InstalledLooseFiles>
                <File path=".\example.dll" />
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
        <Mod guid="f5af55f9-c32b-4bb9-b0d9-72e93634ba54">
          <Title>ModLooseFilesDisabled</Title>
          <Folder>ModLooseFilesDisabled</Folder>
          <Version>1.0</Version>
          <NexusMods id="-1">
            <URL></URL>
          </NexusMods>
          <DiskState>
            <Current isDeployed="false">
              <InstallationMethod>LooseFiles</InstallationMethod>
              <ArchiveName />
              <ArchiveFormat>Auto</ArchiveFormat>
              <ArchiveCompression>Auto</ArchiveCompression>
              <RootFolder>.</RootFolder>
              <InstalledLooseFiles />
            </Current>
            <Pending isEnabled="false">
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
        <Mod guid="9ffa4858-d899-412a-87d7-7c6967f6f698">
          <Title>ModLooseFilesStringsDeployed</Title>
          <Folder>ModLooseFilesStringsDeployed</Folder>
          <Version>1.0</Version>
          <NexusMods id="-1">
            <URL></URL>
          </NexusMods>
          <DiskState>
            <Current isDeployed="true">
              <InstallationMethod>LooseFiles</InstallationMethod>
              <ArchiveName />
              <ArchiveFormat>Auto</ArchiveFormat>
              <ArchiveCompression>Auto</ArchiveCompression>
              <RootFolder>.</RootFolder>
              <InstalledLooseFiles>
                <File path=".\Data\strings\seventy_six_en.dlstrings" />
                <File path=".\Data\strings\seventy_six_en.ilstrings" />
                <File path=".\Data\strings\seventy_six_en.strings" />
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
        <Mod guid="6eb57375-516b-4356-826e-e62604639b48">
          <Title>ModLooseFilesStringsDataDeployed</Title>
          <Folder>ModLooseFilesStringsDataDeployed</Folder>
          <Version>1.0</Version>
          <NexusMods id="-1">
            <URL></URL>
          </NexusMods>
          <DiskState>
            <Current isDeployed="true">
              <InstallationMethod>LooseFiles</InstallationMethod>
              <ArchiveName />
              <ArchiveFormat>Auto</ArchiveFormat>
              <ArchiveCompression>Auto</ArchiveCompression>
              <RootFolder>Data</RootFolder>
              <InstalledLooseFiles>
                <File path=".\strings\seventy_six_en.dlstrings" />
                <File path=".\strings\seventy_six_en.ilstrings" />
                <File path=".\strings\seventy_six_en.strings" />
              </InstalledLooseFiles>
            </Current>
            <Pending isEnabled="true">
              <InstallationMethod>LooseFiles</InstallationMethod>
              <ArchiveName>untitled.ba2</ArchiveName>
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
        <Mod guid="2e45a868-1d35-49c9-be03-845c6b199afe">
          <Title>ModSeparateAutoDeployed</Title>
          <Folder>ModSeparateAutoDeployed</Folder>
          <Version>1.0</Version>
          <NexusMods id="-1">
            <URL></URL>
          </NexusMods>
          <DiskState>
            <Current isDeployed="true">
              <InstallationMethod>SeparateBA2</InstallationMethod>
              <ArchiveName>ModSeparateAutoDeployed.ba2</ArchiveName>
              <ArchiveFormat>Auto</ArchiveFormat>
              <ArchiveCompression>Auto</ArchiveCompression>
              <RootFolder>.</RootFolder>
              <InstalledLooseFiles />
            </Current>
            <Pending isEnabled="true">
              <InstallationMethod>SeparateBA2</InstallationMethod>
              <ArchiveName>ModSeparateAutoDeployed.ba2</ArchiveName>
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
        <Mod guid="a1b2c3d4-0001-4000-8000-000000000001">
          <Title>ModBundledSounds</Title>
          <Folder>ModBundledSounds</Folder>
          <Version>1.0</Version>
          <NexusMods id="-1">
            <URL></URL>
          </NexusMods>
          <DiskState>
            <Current isDeployed="true">
              <InstallationMethod>BundledBA2</InstallationMethod>
              <ArchiveName />
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
        <Mod guid="a1b2c3d4-0002-4000-8000-000000000002">
          <Title>ModSeparateSounds</Title>
          <Folder>ModSeparateSounds</Folder>
          <Version>1.0</Version>
          <NexusMods id="-1">
            <URL></URL>
          </NexusMods>
          <DiskState>
            <Current isDeployed="true">
              <InstallationMethod>SeparateBA2</InstallationMethod>
              <ArchiveName>ModSeparateSounds.ba2</ArchiveName>
              <ArchiveFormat>General</ArchiveFormat>
              <ArchiveCompression>Uncompressed</ArchiveCompression>
              <RootFolder>.</RootFolder>
              <InstalledLooseFiles />
            </Current>
            <Pending isEnabled="true">
              <InstallationMethod>SeparateBA2</InstallationMethod>
              <ArchiveName>ModSeparateSounds.ba2</ArchiveName>
              <ArchiveFormat>General</ArchiveFormat>
              <ArchiveCompression>Uncompressed</ArchiveCompression>
              <RootFolder>Data</RootFolder>
            </Pending>
            <FrozenData isFrozen="false" freeze="false">
              <ArchiveFormat>General</ArchiveFormat>
              <ArchiveCompression>Uncompressed</ArchiveCompression>
            </FrozenData>
          </DiskState>
          <Notes></Notes>
        </Mod>
      </ManagedMods>
    "#};
    let resources_txt = "Bundled.ba2,ModFrozenSeparateDeployed.ba2,ModSeparateDeployed.ba2,ModSeparateAutoDeployed.ba2,ModSeparateSounds.ba2";

    // Setup folders and standard files:
    fs::create_dir_all(&paths.game_data_path).unwrap();
    fs::create_dir_all(&paths.mods_path).unwrap();
    fs::create_dir_all(&paths.frozen_data_path).unwrap();
    fs_util::write_to_file(paths.game_data_path.join("SeventySix.esm"), "").unwrap();

    // Setup mod meta data:
    fs_util::write_to_file(paths.mods_path.join("managed.xml"), managed_xml).unwrap();
    fs_util::write_to_file(paths.mods_path.join("resources.txt"), resources_txt).unwrap();

    // Setup deployed files in Data:
    fs::copy(
        Path::new("tests/fixtures/general_default.ba2"),
        paths.game_data_path.join("Bundled.ba2"),
    )
    .unwrap();
    fs::copy(
        Path::new("tests/fixtures/general_default.ba2"),
        paths.game_data_path.join("ModFrozenSeparateDeployed.ba2"),
    )
    .unwrap();
    fs::copy(
        Path::new("tests/fixtures/general_default.ba2"),
        paths.game_data_path.join("ModSeparateDeployed.ba2"),
    )
    .unwrap();
    fs::copy(
        Path::new("tests/fixtures/general_default.ba2"),
        paths.game_data_path.join("ModSeparateAutoDeployed.ba2"),
    )
    .unwrap();
    fs::copy(
        Path::new("tests/fixtures/general_none_sounds.ba2"),
        paths.game_data_path.join("ModSeparateSounds.ba2"),
    )
    .unwrap();

    // Setup deployed strings files in Data/strings:
    let data_strings_path = paths.game_data_path.join("strings");
    fs::create_dir_all(&data_strings_path).unwrap();
    fs_util::write_to_file(data_strings_path.join("seventy_six_en.strings"), "strings").unwrap();
    fs_util::write_to_file(
        data_strings_path.join("seventy_six_en.ilstrings"),
        "ilstrings",
    )
    .unwrap();
    fs_util::write_to_file(
        data_strings_path.join("seventy_six_en.dlstrings"),
        "dlstrings",
    )
    .unwrap();

    // Setup frozen archives:
    fs::copy(
        Path::new("tests/fixtures/general_default.ba2"),
        paths
            .frozen_data_path
            .join("{3283cd91-d01f-4ca7-a386-854abc3ea133}.ba2"),
    )
    .unwrap();
    fs::copy(
        Path::new("tests/fixtures/general_default.ba2"),
        paths
            .frozen_data_path
            .join("{787f1467-e67c-4dab-afa9-76c92f555aa8}.ba2"),
    )
    .unwrap();

    // Setup deployed loose file in game root:
    fs_util::write_to_file(paths.game_path.join("example.dll"), "dll").unwrap();

    // Setup mod folders with files:
    let mod_folders = [
        "ModFrozenSeparateDeployed",
        "ModFrozenSeparateDisabled",
        "ModFreezeSeparateDisabled",
        "ModSeparateDisabled",
        "ModSeparateDeployed",
        "ModBundledDeployed",
        "ModBundledDisabled",
        "ModSeparateAutoDeployed",
    ];
    for folder in mod_folders {
        let materials_path = paths
            .mods_path
            .join(folder)
            .join("materials")
            .join("landscape")
            .join("plants");
        fs::create_dir_all(&materials_path).unwrap();
        fs_util::write_to_file(materials_path.join("greensealeaf01.bgsm"), "BGSM").unwrap();
    }

    let sound_mod_folders = ["ModBundledSounds", "ModSeparateSounds"];
    for folder in sound_mod_folders {
        let sound_fx_path = paths.mods_path.join(folder).join("sound").join("fx");
        fs::create_dir_all(&sound_fx_path).unwrap();
        fs::copy(
            Path::new("tests/fixtures/sine.wav"),
            sound_fx_path.join("sine.wav"),
        )
        .unwrap();
        fs::copy(
            Path::new("tests/fixtures/sine.xwm"),
            sound_fx_path.join("sine.xwm"),
        )
        .unwrap();
    }

    fs::create_dir_all(paths.mods_path.join("ModLooseFilesDeployed")).unwrap();
    fs_util::write_to_file(
        paths
            .mods_path
            .join("ModLooseFilesDeployed")
            .join("example.dll"),
        "MZ",
    )
    .unwrap();

    fs::create_dir_all(paths.mods_path.join("ModLooseFilesDisabled")).unwrap();
    fs_util::write_to_file(
        paths
            .mods_path
            .join("ModLooseFilesDisabled")
            .join("example.dll"),
        "MZ",
    )
    .unwrap();

    let strings_deployed_path = paths
        .mods_path
        .join("ModLooseFilesStringsDeployed")
        .join("Data")
        .join("strings");
    fs::create_dir_all(&strings_deployed_path).unwrap();
    fs_util::write_to_file(
        strings_deployed_path.join("seventy_six_en.strings"),
        "strings",
    )
    .unwrap();
    fs_util::write_to_file(
        strings_deployed_path.join("seventy_six_en.ilstrings"),
        "ilstrings",
    )
    .unwrap();
    fs_util::write_to_file(
        strings_deployed_path.join("seventy_six_en.dlstrings"),
        "dlstrings",
    )
    .unwrap();

    let strings_data_deployed_path = paths
        .mods_path
        .join("ModLooseFilesStringsDataDeployed")
        .join("strings");
    fs::create_dir_all(&strings_data_deployed_path).unwrap();
    fs_util::write_to_file(
        strings_data_deployed_path.join("seventy_six_en.strings"),
        "strings",
    )
    .unwrap();
    fs_util::write_to_file(
        strings_data_deployed_path.join("seventy_six_en.ilstrings"),
        "ilstrings",
    )
    .unwrap();
    fs_util::write_to_file(
        strings_data_deployed_path.join("seventy_six_en.dlstrings"),
        "dlstrings",
    )
    .unwrap();

    paths
}

#[ignore = "Can take up to one minute to complete with wine"]
#[test]
pub fn test_migration_migrate_2() {
    use crate::features::resourcelists::ResourceList;

    test_utils::setup_stdout_logger();
    let paths = setup_test_case_2();

    let mut ini = Ini::new();
    ini.set_string(
        Some("Archive"),
        "sResourceArchive2List",
        "Bundled.ba2,ModFrozenSeparateDeployed.ba2,ModSeparateDeployed.ba2,ModSeparateAutoDeployed.ba2,ModSeparateSounds.ba2",
    );

    let archive_list_before =
        ResourceList::load_from_ini(&ini, Some("Archive"), "sResourceArchive2List");
    assert_eq!(archive_list_before.resources.len(), 5);

    super::migrate_legacy_managed_mods(&paths.game_path, &paths.mods_path, &mut ini, None).unwrap();

    // INI archive lists should be empty after migration:
    let archive_list_after =
        ResourceList::load_from_ini(&ini, Some("Archive"), "sResourceArchive2List");
    assert!(
        archive_list_after.resources.is_empty(),
        "sResourceArchive2List should be empty after migration, got: {:?}",
        archive_list_after.resources
    );
    let index_list_after =
        ResourceList::load_from_ini(&ini, Some("Archive"), "sResourceIndexFileList");
    assert!(
        index_list_after.resources.is_empty(),
        "sResourceIndexFileList should be empty after migration, got: {:?}",
        index_list_after.resources
    );

    // Metadata files:
    assert!(paths.mods_path.join("managed.xml").exists());
    assert!(paths.mods_path.join("resources.txt").exists());
    assert!(paths.mods_path.join("mods.json").exists());

    // Cleanup:
    assert!(!get_mods_temp_path(&paths.mods_path).exists());
    assert!(!paths.game_path.join("Mods.old").exists());
    assert!(!paths.frozen_data_path.exists());

    // Game Data folder should only contain SeventySix.esm:
    assert!(!paths.game_data_path.join("Bundled.ba2").exists());
    assert!(
        !paths
            .game_data_path
            .join("ModFrozenSeparateDeployed.ba2")
            .exists()
    );
    assert!(
        !paths
            .game_data_path
            .join("ModSeparateDeployed.ba2")
            .exists()
    );
    assert!(
        !paths
            .game_data_path
            .join("ModSeparateAutoDeployed.ba2")
            .exists()
    );
    assert!(!paths.game_data_path.join("ModSeparateSounds.ba2").exists());
    assert!(!paths.game_data_path.join("strings").exists());
    assert!(paths.game_data_path.join("SeventySix.esm").exists());

    // Loose file in game root should be removed:
    assert!(!paths.game_path.join("example.dll").exists());

    // Mod folders should exist with expected structure:
    assert!(
        paths
            .mods_path
            .join("ModFrozenSeparateDeployed")
            .join("ModFrozenSeparateDeployed.ba2")
            .exists()
    );
    assert!(
        paths
            .mods_path
            .join("ModFrozenSeparateDisabled")
            .join("ModFrozenSeparateDisabled.ba2")
            .exists()
    );
    assert!(
        paths
            .mods_path
            .join("ModSeparateDeployed")
            .join("ModSeparateDeployed.ba2")
            .exists()
    );
    assert!(
        paths
            .mods_path
            .join("ModFreezeSeparateDisabled")
            .join("ModFreezeSeparateDisabled.ba2")
            .exists()
    );
    assert!(
        paths
            .mods_path
            .join("ModSeparateDisabled")
            .join("ModSeparateDisabled.ba2")
            .exists()
    );
    assert!(
        paths
            .mods_path
            .join("ModBundledDeployed")
            .join("Data")
            .join("ModBundledDeployed.ba2")
            .exists()
    );
    assert!(
        paths
            .mods_path
            .join("ModBundledDisabled")
            .join("Data")
            .join("ModBundledDisabled.ba2")
            .exists()
    );
    assert!(
        paths
            .mods_path
            .join("ModSeparateAutoDeployed")
            .join("Data")
            .join("ModSeparateAutoDeployed.ba2")
            .exists()
    );
    assert!(
        paths
            .mods_path
            .join("ModBundledSounds")
            .join("Data")
            .join("ModBundledSounds - Sounds.ba2")
            .exists()
    );
    assert!(
        paths
            .mods_path
            .join("ModSeparateSounds")
            .join("ModSeparateSounds.ba2")
            .exists()
    );
    assert!(
        paths
            .mods_path
            .join("ModLooseFilesDeployed")
            .join("example.dll")
            .exists()
    );
    assert!(
        paths
            .mods_path
            .join("ModLooseFilesDisabled")
            .join("example.dll")
            .exists()
    );
    assert!(
        paths
            .mods_path
            .join("ModLooseFilesStringsDeployed")
            .join("Data")
            .join("strings")
            .join("seventy_six_en.strings")
            .exists()
    );
    assert!(
        paths
            .mods_path
            .join("ModLooseFilesStringsDataDeployed")
            .join("strings")
            .join("seventy_six_en.strings")
            .exists()
    );

    // Verify mods.json:
    let managed = load_mods(&paths.mods_path).unwrap().unwrap();
    assert!(managed.enabled);
    assert_eq!(managed.mods.len(), 14);
    assert!(managed.state.is_empty());
    assert!(managed.migrated_from_v1.is_some());

    // Verify enabled states match the pending isEnabled from managed.xml:
    let enabled_mods: Vec<&str> = managed
        .mods
        .iter()
        .filter(|m| m.enabled)
        .map(|m| m.title.as_str())
        .collect();
    assert_eq!(enabled_mods.len(), 9);
    assert!(enabled_mods.contains(&"ModFrozenSeparateDeployed"));
    assert!(enabled_mods.contains(&"ModSeparateDeployed"));
    assert!(enabled_mods.contains(&"ModBundledDeployed"));
    assert!(enabled_mods.contains(&"ModLooseFilesDeployed"));
    assert!(enabled_mods.contains(&"ModLooseFilesStringsDeployed"));
    assert!(enabled_mods.contains(&"ModLooseFilesStringsDataDeployed"));
    assert!(enabled_mods.contains(&"ModSeparateAutoDeployed"));
    assert!(enabled_mods.contains(&"ModBundledSounds"));
    assert!(enabled_mods.contains(&"ModSeparateSounds"));

    let disabled_mods: Vec<&str> = managed
        .mods
        .iter()
        .filter(|m| !m.enabled)
        .map(|m| m.title.as_str())
        .collect();
    assert_eq!(disabled_mods.len(), 5);
    assert!(disabled_mods.contains(&"ModFrozenSeparateDisabled"));
    assert!(disabled_mods.contains(&"ModFreezeSeparateDisabled"));
    assert!(disabled_mods.contains(&"ModSeparateDisabled"));
    assert!(disabled_mods.contains(&"ModBundledDisabled"));
    assert!(disabled_mods.contains(&"ModLooseFilesDisabled"));
}

/// LooseFiles deployed file paths with different separator / prefix styles.
/// All variants should resolve to the same file in the game folder.
#[test]
pub fn test_migration_loose_path_variations() {
    test_utils::setup_stdout_logger();
    let paths = TestPaths::new();
    let managed_xml = indoc! {r#"
        <?xml version="1.0" encoding="utf-8"?>
        <ManagedMods enabled="true" nwmode="false">
        <Mod guid="path-variants-1">
            <Title>ModPathVariants</Title>
            <Folder>ModPathVariants</Folder>
            <Version>1.0</Version>
            <NexusMods id="-1">
            <URL></URL>
            </NexusMods>
            <DiskState>
            <Current isDeployed="true">
                <InstallationMethod>LooseFiles</InstallationMethod>
                <ArchiveName />
                <ArchiveFormat>Auto</ArchiveFormat>
                <ArchiveCompression>Auto</ArchiveCompression>
                <RootFolder>.</RootFolder>
                <InstalledLooseFiles>
                <File path=".\backslash.dll" />
                <File path=".\forward\slash.dll" />
                <File path="./dot_slash.dll" />
                <File path=".\dot_backslash.dll" />
                <File path="no_prefix.dll" />
                <File path="barefile.dll" />
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

    fs::create_dir_all(&paths.game_data_path).unwrap();
    fs::create_dir_all(&paths.mods_path).unwrap();
    fs::create_dir_all(&paths.frozen_data_path).unwrap();
    fs_util::write_to_file(paths.game_data_path.join("SeventySix.esm"), "").unwrap();
    fs_util::write_to_file(paths.mods_path.join("managed.xml"), managed_xml).unwrap();
    fs_util::write_to_file(paths.mods_path.join("resources.txt"), "").unwrap();

    let mod_path = paths.mods_path.join("ModPathVariants");
    fs::create_dir_all(&mod_path).unwrap();
    fs_util::write_to_file(mod_path.join("modfile.txt"), "mod").unwrap();

    fs_util::write_to_file(paths.game_path.join("backslash.dll"), "1").unwrap();
    let forward_dir = paths.game_path.join("forward");
    fs::create_dir_all(&forward_dir).unwrap();
    fs_util::write_to_file(forward_dir.join("slash.dll"), "2").unwrap();
    fs_util::write_to_file(paths.game_path.join("dot_slash.dll"), "3").unwrap();
    fs_util::write_to_file(paths.game_path.join("dot_backslash.dll"), "4").unwrap();
    fs_util::write_to_file(paths.game_path.join("no_prefix.dll"), "5").unwrap();
    fs_util::write_to_file(paths.game_path.join("barefile.dll"), "6").unwrap();

    let mut ini = Ini::new();
    super::remove_legacy_managed_mods(&paths.game_path, &paths.mods_path, &mut ini, None).unwrap();

    assert!(!paths.game_path.join("backslash.dll").exists());
    assert!(!paths.game_path.join("forward").join("slash.dll").exists());
    assert!(!paths.game_path.join("dot_slash.dll").exists());
    assert!(!paths.game_path.join("dot_backslash.dll").exists());
    assert!(!paths.game_path.join("no_prefix.dll").exists());
    assert!(!paths.game_path.join("barefile.dll").exists());
}

/// `get_frozen_archive_path` must match v1's `ManagedMod.FrozenArchivePath`:
/// `<game path>\FrozenData\{<guid>}.ba2`, i.e. FrozenData is a sibling of the Mods folder
/// and the archive name is the guid wrapped in braces.
#[test]
pub fn test_get_frozen_archive_path() {
    let tmp_dir = TempDir::new().unwrap();
    let mods_path = tmp_dir.path().join("Fallout 76").join("Mods");
    let guid = "2f2d3b3b-b21b-4ec2-b555-c8806a801b16";

    let path = super::migrate::get_frozen_archive_path(&mods_path, guid).unwrap();

    assert_eq!(
        path,
        tmp_dir
            .path()
            .join("Fallout 76")
            .join("FrozenData")
            .join("{2f2d3b3b-b21b-4ec2-b555-c8806a801b16}.ba2")
    );
}

// ============================================================================
// Edge Case Tests
// ============================================================================

fn setup_minimal_mod() -> TestPaths {
    let paths = TestPaths::new();
    let managed_xml = indoc! {r#"
        <?xml version="1.0" encoding="utf-8"?>
        <ManagedMods enabled="true" nwmode="false">
        <Mod guid="edge-guid-1">
            <Title>EdgeMod</Title>
            <Folder>EdgeMod</Folder>
            <Version>1.0</Version>
            <NexusMods id="-1">
            <URL></URL>
            </NexusMods>
            <DiskState>
            <Current isDeployed="true">
                <InstallationMethod>LooseFiles</InstallationMethod>
                <ArchiveName />
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

    fs::create_dir_all(&paths.game_data_path).unwrap();
    fs::create_dir_all(&paths.mods_path).unwrap();
    fs_util::write_to_file(paths.game_data_path.join("SeventySix.esm"), "").unwrap();
    fs_util::write_to_file(paths.mods_path.join("managed.xml"), managed_xml).unwrap();
    fs_util::write_to_file(paths.mods_path.join("resources.txt"), "").unwrap();
    let mod_path = paths.mods_path.join("EdgeMod");
    fs::create_dir_all(&mod_path).unwrap();
    fs_util::write_to_file(mod_path.join("file.txt"), "content").unwrap();

    paths
}

#[test]
pub fn test_migration_mods_old_exists_fails() {
    test_utils::setup_stdout_logger();
    let paths = setup_minimal_mod();
    let mods_old_path = paths.game_path.join("Mods.old");
    fs::create_dir_all(&mods_old_path).unwrap();
    fs_util::write_to_file(mods_old_path.join("stale.txt"), "stale").unwrap();

    let mut ini = Ini::new();
    let result =
        super::migrate_legacy_managed_mods(&paths.game_path, &paths.mods_path, &mut ini, None);
    assert!(
        result.is_err(),
        "Migration should fail when Mods.old already exists"
    );
}

#[test]
pub fn test_migration_missing_managed_xml_fails() {
    test_utils::setup_stdout_logger();
    let paths = setup_minimal_mod();
    fs::remove_file(paths.mods_path.join("managed.xml")).unwrap();

    let mut ini = Ini::new();
    let result =
        super::migrate_legacy_managed_mods(&paths.game_path, &paths.mods_path, &mut ini, None);
    assert!(
        result.is_err(),
        "Migration should fail when managed.xml is missing"
    );
}

#[test]
pub fn test_migration_missing_resources_txt_succeeds() {
    test_utils::setup_stdout_logger();
    let paths = setup_minimal_mod();
    fs::remove_file(paths.mods_path.join("resources.txt")).unwrap();

    let mut ini = Ini::new();
    let result =
        super::migrate_legacy_managed_mods(&paths.game_path, &paths.mods_path, &mut ini, None);
    assert!(
        result.is_ok(),
        "Migration should succeed even when resources.txt is missing"
    );
    assert!(paths.mods_path.join("mods.json").exists());
    assert!(paths.mods_path.join("resources.txt").exists());
}

#[test]
pub fn test_migration_different_mods_path() {
    test_utils::setup_stdout_logger();
    let tmp_dir = TempDir::new().unwrap();
    let game_path = tmp_dir.path().join("game").join("Fallout76");
    let game_data_path = game_path.join("Data");
    let mods_path = tmp_dir.path().join("mods").join("Mods");
    let mods_old_path = tmp_dir.path().join("mods").join("Mods.old");
    let frozen_data_path = tmp_dir.path().join("mods").join("FrozenData");

    let managed_xml = indoc! {r#"
        <?xml version="1.0" encoding="utf-8"?>
        <ManagedMods enabled="true" nwmode="false">
        <Mod guid="diff-path-guid-1">
            <Title>DiffPathMod</Title>
            <Folder>DiffPathMod</Folder>
            <Version>1.0</Version>
            <NexusMods id="-1">
            <URL></URL>
            </NexusMods>
            <DiskState>
            <Current isDeployed="true">
                <InstallationMethod>LooseFiles</InstallationMethod>
                <ArchiveName />
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
        <Mod guid="diff-path-guid-frozen">
            <Title>DiffPathFrozen</Title>
            <Folder>DiffPathFrozen</Folder>
            <Version>1.0</Version>
            <NexusMods id="-1">
            <URL></URL>
            </NexusMods>
            <DiskState>
            <Current isDeployed="true">
                <InstallationMethod>SeparateBA2</InstallationMethod>
                <ArchiveName>DiffPathFrozen.ba2</ArchiveName>
                <ArchiveFormat>General</ArchiveFormat>
                <ArchiveCompression>Compressed</ArchiveCompression>
                <RootFolder>.</RootFolder>
                <InstalledLooseFiles />
            </Current>
            <Pending isEnabled="true">
                <InstallationMethod>SeparateBA2</InstallationMethod>
                <ArchiveName>DiffPathFrozen.ba2</ArchiveName>
                <ArchiveFormat>General</ArchiveFormat>
                <ArchiveCompression>Compressed</ArchiveCompression>
                <RootFolder>Data</RootFolder>
            </Pending>
            <FrozenData isFrozen="true" freeze="true">
                <ArchiveFormat>General</ArchiveFormat>
                <ArchiveCompression>Compressed</ArchiveCompression>
            </FrozenData>
            </DiskState>
            <Notes></Notes>
        </Mod>
        </ManagedMods>
    "#};

    fs::create_dir_all(&game_data_path).unwrap();
    fs::create_dir_all(&mods_path).unwrap();
    fs::create_dir_all(&frozen_data_path).unwrap();
    fs_util::write_to_file(game_data_path.join("SeventySix.esm"), "").unwrap();
    fs_util::write_to_file(mods_path.join("managed.xml"), managed_xml).unwrap();
    fs_util::write_to_file(mods_path.join("resources.txt"), "").unwrap();
    let mod_path = mods_path.join("DiffPathMod");
    fs::create_dir_all(&mod_path).unwrap();
    fs_util::write_to_file(mod_path.join("file.txt"), "content").unwrap();

    let frozen_mod_path = mods_path.join("DiffPathFrozen");
    let frozen_materials = frozen_mod_path.join("materials");
    fs::create_dir_all(&frozen_materials).unwrap();
    fs_util::write_to_file(frozen_materials.join("mat.bgsm"), "BGSM").unwrap();
    fs::copy(
        Path::new("tests/fixtures/general_default.ba2"),
        frozen_data_path.join("{diff-path-guid-frozen}.ba2"),
    )
    .unwrap();
    fs::copy(
        Path::new("tests/fixtures/general_default.ba2"),
        game_data_path.join("DiffPathFrozen.ba2"),
    )
    .unwrap();

    let mut ini = Ini::new();
    let result = super::migrate_legacy_managed_mods(&game_path, &mods_path, &mut ini, None);
    assert!(
        result.is_ok(),
        "Migration should succeed when mods_path is not game_path/Mods, got: {:?}",
        result.err()
    );

    assert!(mods_path.join("mods.json").exists());
    assert!(mods_path.join("managed.xml").exists());
    assert!(mods_path.join("resources.txt").exists());
    assert!(mods_path.join("DiffPathMod").join("file.txt").exists());
    assert!(
        mods_path
            .join("DiffPathFrozen")
            .join("DiffPathFrozen.ba2")
            .exists(),
        "Frozen archive should be moved from mods_path.parent()/FrozenData into the new mod folder"
    );
    assert!(!game_data_path.join("DiffPathFrozen.ba2").exists());
    assert!(!mods_old_path.exists());
    assert!(!frozen_data_path.exists());

    let managed = load_mods(&mods_path).unwrap().unwrap();
    assert!(managed.enabled);
    assert_eq!(managed.mods.len(), 2);
    assert!(managed.migrated_from_v1.is_some());
}
