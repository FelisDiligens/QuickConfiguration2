#![cfg(test)]

use super::mods::*;

use crate::utils::serde_xml::xml_from_str;
use indoc::indoc;

#[test]
fn test_mod_info_xml_load() {
    let test_str = indoc! {r#"
        <?xml version="1.0" encoding="utf-8"?>
        <Mods>
          <Mod game="fallout76" id="546" nsfw="false">
            <Title>Fallout 76 Quick Configuration - INI-Editor and Mod Manager</Title>
            <Version>1.12.8</Version>
            <CreatedBy>FelisDiligens</CreatedBy>
            <UploadedBy>FelisDiligens</UploadedBy>
            <EndorsementCount>7442</EndorsementCount>
            <CreatedTimestamp>1586526633</CreatedTimestamp>
            <UpdatedTimestamp>1753040884</UpdatedTimestamp>
            <EndorseState>Undecided</EndorseState>
            <Summary>This tool allows you to tweak *.ini settings and install mods.</Summary>
            <Thumbnail>
              <URL>https://staticdelivery.nexusmods.com/mods/2590/images/546/546-1654537179-893568444.png</URL>
              <File>thumb_546.jpg</File>
            </Thumbnail>
            <LastUpdated>1772788848</LastUpdated>
          </Mod>
        </Mods>
    "#};
    let result: Result<Mods, quick_xml::DeError> = xml_from_str(&test_str);
    assert!(result.is_ok());

    let deserialized: Mods = result.unwrap();
    assert_eq!(deserialized.mods.len(), 1);
    println!("{:#?}", deserialized);

    let mod_info = &deserialized.mods[0];
    assert_eq!(mod_info.id, 546);
    assert_eq!(mod_info.game, Some("fallout76".to_string()));
    assert_eq!(mod_info.contains_adult_content, Some(false));
    assert_eq!(
        mod_info.title,
        "Fallout 76 Quick Configuration - INI-Editor and Mod Manager"
    );
    assert_eq!(mod_info.latest_version, "1.12.8");
    assert_eq!(mod_info.author, "FelisDiligens");
    assert_eq!(mod_info.uploader, "FelisDiligens");
    assert_eq!(mod_info.endorsement_count, 7442);
    assert_eq!(mod_info.created_timestamp, 1586526633);
    assert_eq!(mod_info.updated_timestamp, 1753040884);
    assert_eq!(mod_info.endorse_state, EndorseState::Undecided);
    assert_eq!(
        mod_info.summary,
        "This tool allows you to tweak *.ini settings and install mods."
    );
    assert!(mod_info.thumbnail.is_some());
    assert_eq!(
        mod_info.thumbnail.as_ref().unwrap().url,
        "https://staticdelivery.nexusmods.com/mods/2590/images/546/546-1654537179-893568444.png"
    );
    assert_eq!(mod_info.thumbnail.as_ref().unwrap().file, "thumb_546.jpg");
    assert_eq!(mod_info.last_access_timestamp, 1772788848);
}
