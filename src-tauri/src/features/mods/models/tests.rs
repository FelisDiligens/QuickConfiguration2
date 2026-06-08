#![cfg(test)]

use std::vec;

use crate::utils::serde_xml::{xml_from_str, xml_to_string_pretty};

use super::xml::*;

#[test]
fn test_xml_load() {
    let test_str = r#"<?xml version="1.0" encoding="utf-8"?>
<ManagedMods enabled="true" nwmode="false">
  <Mod guid="f2ccb591-1851-45ef-8aca-cce1f839b678">
    <Title>HUDModLoader</Title>
    <Folder>HUDModLoader</Folder>
    <Version>1.0</Version>
    <NexusMods id="-1">
      <URL></URL>
    </NexusMods>
    <DiskState>
      <Current isDeployed="false">
        <InstallationMethod>SeparateBA2</InstallationMethod>
        <ArchiveName>HUDModLoader.ba2</ArchiveName>
        <ArchiveFormat>General</ArchiveFormat>
        <ArchiveCompression>Uncompressed</ArchiveCompression>
        <RootFolder>.</RootFolder>
        <InstalledLooseFiles />
      </Current>
      <Pending isEnabled="false">
        <InstallationMethod>SeparateBA2</InstallationMethod>
        <ArchiveName>HUDModLoader.ba2</ArchiveName>
        <ArchiveFormat>General</ArchiveFormat>
        <ArchiveCompression>Uncompressed</ArchiveCompression>
        <RootFolder>.</RootFolder>
      </Pending>
      <FrozenData isFrozen="true" freeze="true">
        <ArchiveFormat>General</ArchiveFormat>
        <ArchiveCompression>Uncompressed</ArchiveCompression>
      </FrozenData>
    </DiskState>
    <Notes></Notes>
  </Mod>
  <Mod guid="c2ac1a4b-9bab-4ff3-8d7d-a136cc50ade7">
    <Title>HUDModLoader INI</Title>
    <Folder>HUDModLoader-INI</Folder>
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
        <RootFolder>Data</RootFolder>
        <InstalledLooseFiles />
      </Current>
      <Pending isEnabled="false">
        <InstallationMethod>LooseFiles</InstallationMethod>
        <ArchiveName>HUDModLoader-3144-59-2-1748010023.ba2</ArchiveName>
        <ArchiveFormat>General</ArchiveFormat>
        <ArchiveCompression>Uncompressed</ArchiveCompression>
        <RootFolder>Data</RootFolder>
      </Pending>
      <FrozenData isFrozen="false" freeze="false">
        <ArchiveFormat>Auto</ArchiveFormat>
        <ArchiveCompression>Auto</ArchiveCompression>
      </FrozenData>
    </DiskState>
    <Notes></Notes>
  </Mod>
</ManagedMods>"#;
    let deserialized: ManagedMods = xml_from_str(&test_str).unwrap();
    println!("{:#?}", deserialized);
}

#[test]
fn test_xml_save() {
    let example = ManagedMods {
        enabled: true,
        nuclear_winter_mode: false,
        mods: vec![ManagedMod {
            guid: "f2ccb591-1851-45ef-8aca-cce1f839b678".to_string(),
            title: "HUDModLoader".to_string(),
            folder: "HUDModLoader".to_string(),
            version: "1.0".to_string(),
            nexusmods: ModNexusMods {
                id: -1,
                url: "".to_string(),
            },
            state: ModDiskState {
                current: ModDiskStateCurrent {
                    deployed: false,
                    installation_method: InstallationMethod::SeparateBA2,
                    archive_name: "HUDModLoader.ba2".to_string(),
                    archive_format: ArchiveFormat::General,
                    archive_compression: ArchiveCompression::Uncompressed,
                    root_folder: ".".to_string(),
                    installed_loose_files: InstalledLooseFiles { files: None },
                },
                pending: ModDiskStatePending {
                    enabled: false,
                    installation_method: InstallationMethod::SeparateBA2,
                    archive_name: "HUDModLoader.ba2".to_string(),
                    archive_format: ArchiveFormat::General,
                    archive_compression: ArchiveCompression::Uncompressed,
                    root_folder: ".".to_string(),
                },
                frozen_data: ModDiskStateFrozenData {
                    frozen: true,
                    freeze: true,
                    archive_format: ArchiveFormat::General,
                    archive_compression: ArchiveCompression::Uncompressed,
                },
            },
            notes: "".to_string(),
        }],
    };
    let xml = xml_to_string_pretty(&example).unwrap();
    // Not exactly one-to-one: `<InstalledLooseFiles />` --> `<InstalledLooseFiles/>`
    // But close enough
    let expected_str = r#"<?xml version="1.0" encoding="utf-8"?>
<ManagedMods enabled="true" nwmode="false">
  <Mod guid="f2ccb591-1851-45ef-8aca-cce1f839b678">
    <Title>HUDModLoader</Title>
    <Folder>HUDModLoader</Folder>
    <Version>1.0</Version>
    <NexusMods id="-1">
      <URL></URL>
    </NexusMods>
    <DiskState>
      <Current isDeployed="false">
        <InstallationMethod>SeparateBA2</InstallationMethod>
        <ArchiveName>HUDModLoader.ba2</ArchiveName>
        <ArchiveFormat>General</ArchiveFormat>
        <ArchiveCompression>Uncompressed</ArchiveCompression>
        <RootFolder>.</RootFolder>
        <InstalledLooseFiles/>
      </Current>
      <Pending isEnabled="false">
        <InstallationMethod>SeparateBA2</InstallationMethod>
        <ArchiveName>HUDModLoader.ba2</ArchiveName>
        <ArchiveFormat>General</ArchiveFormat>
        <ArchiveCompression>Uncompressed</ArchiveCompression>
        <RootFolder>.</RootFolder>
      </Pending>
      <FrozenData isFrozen="true" freeze="true">
        <ArchiveFormat>General</ArchiveFormat>
        <ArchiveCompression>Uncompressed</ArchiveCompression>
      </FrozenData>
    </DiskState>
    <Notes></Notes>
  </Mod>
</ManagedMods>"#;
    assert_eq!(xml, expected_str);
}
