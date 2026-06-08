#![cfg(test)]

use indoc::indoc;

use crate::features::stores::profiles::models::enums::{GameEdition, LaunchOption};
use crate::features::stores::profiles::models::json;
use crate::features::stores::profiles::xml;
use crate::utils::serde_xml::xml_from_str;

#[test]
fn parse_legacy_profile_v1_11() {
    let xml = indoc! {r#"
        <?xml version="1.0" encoding="utf-8"?>
        <Games selected="0">
        <Game>
            <Title>Microsoft Store</Title>
            <InstallationPath>D:\XboxGames\Fallout 76\Content</InstallationPath>
            <ExecutableName>Project76_GamePass.exe</ExecutableName>
            <ExecParameters></ExecParameters>
            <LauncherURL>shell:appsfolder\BethesdaSoftworks.Fallout76-PC_3275kfvn8vcwc!Fallout76</LauncherURL>
            <IniPrefix>Project76</IniPrefix>
            <GameEdition>MSStore</GameEdition>
            <LaunchOption>OpenURL</LaunchOption>
        </Game>
        </Games>
    "#};
    let result = xml_from_str::<xml::Profiles>(xml);
    assert!(
        result.is_ok(),
        "v1.11 profiles.xml could not be loaded: {}",
        result.unwrap_err()
    );
    let profiles = result.unwrap();
    assert_eq!(profiles.selected, 0);
    assert_eq!(profiles.profiles.len(), 1);
    assert_eq!(profiles.profiles[0].title, "Microsoft Store");
    assert_eq!(
        profiles.profiles[0].installation_path,
        r"D:\XboxGames\Fallout 76\Content"
    );
    assert_eq!(
        profiles.profiles[0].executable_name,
        "Project76_GamePass.exe"
    );
    assert_eq!(profiles.profiles[0].exec_parameters, "");
    assert_eq!(
        profiles.profiles[0].launcher_url,
        r"shell:appsfolder\BethesdaSoftworks.Fallout76-PC_3275kfvn8vcwc!Fallout76"
    );
    assert_eq!(profiles.profiles[0].ini_prefix, "Project76");
    assert_eq!(profiles.profiles[0].game_edition, GameEdition::MSStore);
    assert_eq!(profiles.profiles[0].launch_option, LaunchOption::OpenURL);
}

#[test]
fn migrate_legacy_profile_v1_11() {
    let xml = indoc! {r#"
        <?xml version="1.0" encoding="utf-8"?>
        <Games selected="0">
        <Game>
            <Title>Microsoft Store</Title>
            <InstallationPath>D:\XboxGames\Fallout 76\Content</InstallationPath>
            <ExecutableName>Project76_GamePass.exe</ExecutableName>
            <ExecParameters></ExecParameters>
            <LauncherURL>shell:appsfolder\BethesdaSoftworks.Fallout76-PC_3275kfvn8vcwc!Fallout76</LauncherURL>
            <IniPrefix>Project76</IniPrefix>
            <GameEdition>MSStore</GameEdition>
            <LaunchOption>OpenURL</LaunchOption>
        </Game>
        </Games>
    "#};
    let legacy_profiles = xml_from_str::<xml::Profiles>(xml).unwrap();
    let profiles = json::Profiles::from(legacy_profiles);
    assert_eq!(profiles.selected, profiles.profiles[0].key);
    assert_eq!(profiles.profiles.len(), 1);
    assert_eq!(profiles.profiles[0].title, "Microsoft Store");
    assert_eq!(
        profiles.profiles[0].installation_path,
        r"D:\XboxGames\Fallout 76\Content"
    );
    assert_eq!(
        profiles.profiles[0].executable_name,
        "Project76_GamePass.exe"
    );
    assert_eq!(profiles.profiles[0].exec_parameters, "");
    assert_eq!(
        profiles.profiles[0].launcher_url,
        r"shell:appsfolder\BethesdaSoftworks.Fallout76-PC_3275kfvn8vcwc!Fallout76"
    );
    assert_eq!(profiles.profiles[0].ini_prefix, "Project76");
    assert_eq!(profiles.profiles[0].game_edition, GameEdition::Xbox);
    assert_eq!(profiles.profiles[0].launch_option, LaunchOption::OpenURL);
}
