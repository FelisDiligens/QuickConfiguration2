use std::str::FromStr;

use crate::features::nexusmods::models::json::FileCategory;
use crate::features::nexusmods::models::json::FileUpdate;
use crate::features::nexusmods::models::json::ModFile;
use crate::features::nexusmods::models::json::ModFileInfo;
use crate::features::nexusmods::models::json::ModFiles;
use crate::features::nexusmods::nxm::parse_nxm_link;
use crate::features::nexusmods::utils::get_latest_file;

#[test]
pub fn test_parse_nxm_link() {
    let link = "nxm://fallout76/mods/124/files/13539?key=J_5JcycEZ32XNFuKn-gcXg&expires=1779733241&user_id=41275740";
    let details = parse_nxm_link(link).unwrap();
    assert_eq!(details.game_domain, "fallout76");
    assert_eq!(details.game_scoped_id, 124);
    assert_eq!(details.file_id, 13539);
    assert_eq!(details.key, "J_5JcycEZ32XNFuKn-gcXg");
    assert_eq!(details.expires, 1779733241);
    assert_eq!(details.user_id, 41275740);
}

fn create_file(file_id: u32, name: &str, version: &str, category_name: Option<&str>) -> ModFile {
    ModFile {
        id: vec![file_id],
        uid: 0,
        file_id,
        name: name.to_string(),
        version: version.to_string(),
        category_id: 1,
        category_name: category_name.map(str::to_string),
        category: category_name.and_then(|name| FileCategory::from_str(name).ok()),
        is_primary: false,
        size: 0,
        file_name: format!("{name}-{file_id}.zip"),
        uploaded_time: chrono::DateTime::from_timestamp(0, 0).unwrap(),
        mod_version: version.to_string(),
        external_virus_scan_url: None,
        description: String::new(),
        size_kb: 0,
        size_in_bytes: None,
        changelog_html: None,
        content_preview_link: None,
    }
}

fn create_update(old_file_id: u32, new_file_id: u32) -> FileUpdate {
    FileUpdate {
        old_file_id,
        new_file_id,
        old_file_name: format!("file-{old_file_id}.zip"),
        new_file_name: format!("file-{new_file_id}.zip"),
        uploaded_time: chrono::DateTime::from_timestamp(0, 0).unwrap(),
    }
}

fn create_mod_files(files: Vec<ModFile>, file_updates: Vec<FileUpdate>) -> ModFiles {
    ModFiles {
        file_updates,
        files,
    }
}

#[test]
pub fn test_get_latest_file_already_latest() {
    let files = create_mod_files(vec![create_file(1, "Mod", "1.0", Some("MAIN"))], vec![]);
    assert!(get_latest_file(1, &files).is_none());
}

#[test]
pub fn test_get_latest_file_no_matching_update() {
    let files = create_mod_files(
        vec![
            create_file(1, "Mod", "1.0", Some("MAIN")),
            create_file(2, "Mod", "1.1", Some("MAIN")),
        ],
        vec![create_update(1, 2)],
    );
    assert!(get_latest_file(2, &files).is_none());
    assert!(get_latest_file(99, &files).is_none());
}

#[test]
pub fn test_get_latest_file_single_update() {
    let files = create_mod_files(
        vec![
            create_file(1, "Mod", "1.0", Some("OLD_VERSION")),
            create_file(2, "Mod", "1.1", Some("MAIN")),
        ],
        vec![create_update(1, 2)],
    );
    let latest = get_latest_file(1, &files).unwrap();
    assert_eq!(latest.file_id, 2);
    assert_eq!(latest.version, "1.1");
}

#[test]
pub fn test_get_latest_file_chained_updates() {
    let files = create_mod_files(
        vec![
            create_file(1, "Mod", "1.0", Some("OLD_VERSION")),
            create_file(2, "Mod", "1.1", Some("OLD_VERSION")),
            create_file(3, "Mod", "1.2", Some("MAIN")),
        ],
        vec![create_update(1, 2), create_update(2, 3)],
    );
    let latest = get_latest_file(1, &files).unwrap();
    assert_eq!(latest.file_id, 3);
    assert_eq!(latest.version, "1.2");
}

#[test]
pub fn test_get_latest_file_update_target_missing() {
    let files = create_mod_files(
        vec![create_file(1, "Mod", "1.0", Some("OLD_VERSION"))],
        vec![create_update(1, 99)],
    );
    assert!(get_latest_file(1, &files).is_none());
}

#[test]
pub fn test_get_latest_file_cycle() {
    let files = create_mod_files(
        vec![
            create_file(1, "Mod", "1.0", Some("OLD_VERSION")),
            create_file(2, "Mod", "1.1", Some("MAIN")),
        ],
        vec![create_update(1, 2), create_update(2, 1)],
    );
    assert!(get_latest_file(1, &files).is_none());
}

#[test]
pub fn test_mod_file_info_from_api_response_file_not_found() {
    let files = create_mod_files(vec![create_file(1, "Mod", "1.0", Some("MAIN"))], vec![]);
    let result = ModFileInfo::from_api_response("fallout76".to_string(), 546, 999, &files);
    assert!(result.is_none());
}

#[test]
pub fn test_mod_file_info_from_api_response_without_updates() {
    let files = create_mod_files(vec![create_file(1, "Mod", "1.0", Some("MAIN"))], vec![]);
    let info = ModFileInfo::from_api_response("fallout76".to_string(), 546, 1, &files).unwrap();
    assert_eq!(info.game_domain, "fallout76");
    assert_eq!(info.game_scoped_id, 546);
    assert_eq!(info.file_id, 1);
    assert_eq!(info.name, "Mod");
    assert_eq!(info.version, "1.0");
    assert_eq!(info.category, Some(FileCategory::Main));
    assert!(info.latest_file.is_none());
}

#[test]
pub fn test_mod_file_info_from_api_response_with_updates() {
    let files = create_mod_files(
        vec![
            create_file(1, "Mod", "1.0", Some("OLD_VERSION")),
            create_file(2, "Mod", "1.1", Some("MAIN")),
        ],
        vec![create_update(1, 2)],
    );
    let info = ModFileInfo::from_api_response("fallout76".to_string(), 546, 1, &files).unwrap();
    assert_eq!(info.file_id, 1);
    assert_eq!(info.version, "1.0");
    assert_eq!(info.category, Some(FileCategory::OldVersion));
    let latest = info.latest_file.unwrap();
    assert_eq!(latest.game_domain, "fallout76");
    assert_eq!(latest.game_scoped_id, 546);
    assert_eq!(latest.file_id, 2);
    assert_eq!(latest.name, "Mod");
    assert_eq!(latest.version, "1.1");
    assert_eq!(latest.category, Some(FileCategory::Main));
}

#[test]
pub fn test_mod_file_info_from_api_response_chained_updates() {
    let files = create_mod_files(
        vec![
            create_file(1, "Mod", "1.0", Some("OLD_VERSION")),
            create_file(2, "Mod", "1.1", Some("OLD_VERSION")),
            create_file(3, "Mod", "1.2", Some("MAIN")),
        ],
        vec![create_update(1, 2), create_update(2, 3)],
    );
    let info = ModFileInfo::from_api_response("fallout76".to_string(), 546, 1, &files).unwrap();
    let latest = info.latest_file.unwrap();
    assert_eq!(latest.file_id, 3);
    assert_eq!(latest.version, "1.2");
}

#[test]
pub fn test_mod_file_info_from_api_response_category_parsing() {
    let files = create_mod_files(
        vec![
            create_file(1, "Mod", "1.0", None),
            create_file(2, "Mod", "1.1", Some("UNKNOWN_CATEGORY")),
            create_file(3, "Mod", "1.2", Some("UPDATE")),
        ],
        vec![],
    );
    let info1 = ModFileInfo::from_api_response("fallout76".to_string(), 546, 1, &files).unwrap();
    assert_eq!(info1.category, None);
    let info2 = ModFileInfo::from_api_response("fallout76".to_string(), 546, 2, &files).unwrap();
    assert_eq!(info2.category, None);
    let info3 = ModFileInfo::from_api_response("fallout76".to_string(), 546, 3, &files).unwrap();
    assert_eq!(info3.category, Some(FileCategory::Update));
}
