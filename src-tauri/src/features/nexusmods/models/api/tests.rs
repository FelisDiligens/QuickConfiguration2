#![cfg(test)]

use super::*;

use indoc::indoc;

#[test]
fn test_mod_info_json_load() {
    let test_str = indoc! {r#"
        {
          "name": "Fallout 76 Quick Configuration - INI-Editor and Mod Manager",
          "summary": "This tool allows you to tweak *.ini settings and install mods.",
          "description": "[size=3][b][center][size=5]Supports Steam and Xbox (Game Pass)!\n<br />[/size][/center][/b][/size]\n<br />[center][url=https://www.nexusmods.com/fallout3/mods/21193][img]https://i.imgur.com/B38KCOo.png[/img][/url][/center]\n<br />\n<br />[size=4][center][b]Tired of searching through the web for *.ini tweaks, and installing mods single-handedly?[/b]\n<br />This tool allows you to change various game settings and install mods.\n<br />It is written in C# and [url=https://github.com/FelisDiligens/Fallout76-QuickConfiguration#readme]the source code is available on GitHub.[/url][/center][/size]\n<br />\n<br />[img]https://i.imgur.com/VdXtaeB.png[/img]\n<br />[size=4][b]*.ini tweaks[/b][/size]\n<br />\n<br />[list]\n<br />[*][size=3]Change display, graphics, audio, interface, and voice chat settings.[/size]\n<br />[*][size=3]Disable VSync (frame rate cap).[/size]\n<br />[*][size=3]Change your FOV.[/size]\n<br />[*][size=3]Mouse sensitivity fix for all aspect ratios.[/size]\n<br />[/list]\n<br />\n<br />[size=4][b]Pip-Boy customization[/b][/size]\n<br />\n<br />[list]\n<br />[*][size=3]Change the color and resolution of your Pip-Boy and Quick-Boy.[/size]\n<br />[*][size=3]Use color presets from previous Fallout games.[/size]\n<br />[*][size=3]See a preview of how the color will look in the game.[/size]\n<br />[/list]\n<br />\n<br />[size=4][b]Mod manager[/b][/size]\n<br />\n<br />[list]\n<br />[*][size=3]Install and manage mods.[/size]\n<br />[*][size=3]Check if a mod has an update.[/size] [size=2][i](Requires you to login to NexusMods)[/i][/size]\n<br />[/list]\n<br />\n<br />[size=4][b]Gallery[/b][/size]\n<br />\n<br />[list]\n<br />[*][size=3]Access all your screenshots and photos from the gallery.[/size]\n<br />[/list]\n<br />\n<br />[img]https://i.imgur.com/qXADD2n.png[/img]\n<br />[size=3]This program is running on .NET Framework 4.7.2\n<br />It should be [b]preinstalled on Windows 10.[/b]\n<br />If you can't start the tool, you may have to install it manually: [url=https://dotnet.microsoft.com/download/dotnet-framework/net472].NET Framework 4.7.2 web installer\n<br />[/url][/size]\n<br />[size=3]Archive2 needs  [url=https://www.microsoft.com/en-us/download/details.aspx?id=30679]Visual C++ Redistributable for Visual Studio 2012 Update 4[/url].\n<br />This [b]might [/b]be preinstalled on your system as well. If your mods aren't deploying properly, try to install it.\n<br />\n<br />If you're still on Windows 7, make sure that you have Service Pack 1 and all updates installed.\n<br />Otherwise the .NET installer might fail or the tool might not start.[/size]\n<br />\n<br />\n<br />[img]https://i.imgur.com/5FcWw38.png[/img]\n<br />[list=1]\n<br />[*][size=3][url=https://www.nexusmods.com/fallout76/mods/546?tab=files#mod-page-tab-files]Download[/url] and unzip[i].[/i][/size]\n<br />[*][size=3]Run and set the game edition and path in the Welcome screen.[/size]\n<br />[*][size=3]Tweak to your heart's content.[/size]\n<br />[*][size=3]Don't forget to hit \"Apply\".[/size]\n<br />[/list]\n<br />\n<br />[img]https://i.imgur.com/1d2t9d5.png[/img][size=4]\n<br />[list]\n<br />[*] [size=4][url=https://github.com/FelisDiligens/Fallout76-QuickConfiguration/wiki/Frequently-Asked-Questions-(FAQ)]Frequently Asked Questions[/url][/size]\n<br />[*] [size=4][url=https://github.com/FelisDiligens/Fallout76-QuickConfiguration/wiki/Troubleshooting]Troubleshooting[/url][/size]\n<br />[*] [size=4][url=https://github.com/FelisDiligens/Fallout76-QuickConfiguration/wiki/Mod-Manager-Guide]Mod Manager Guide[/url][/size]\n<br />[/list][/size]\n<br />\n<br />[img]https://i.imgur.com/yoCfQlE.png[/img]\n<br />[size=4][b][color=FFD083]These were/are valuable resources:[/color][/b][/size]\n<br />[list]\n<br />[*][size=3][url=https://www.nexusmods.com/fallout76/mods/38]Bilago's Configuraton Tool[/url][/size]\n<br />[*][size=3][url=https://www.nexusmods.com/fallout76/mods/221]Cloudy01's Mod Manager[/url][/size]\n<br />[*][size=3][url=https://www.nexusmods.com/fallout76/mods/152]runew0lf's Pipboy Color Changer[/url][/size]\n<br />[*][size=3]The Step-Project wiki articles for [url=https://wiki.step-project.com/Guide:SkyrimPrefs_INI]Skyrim's [/url]and [url=https://wiki.step-project.com/Guide:Fallout4Prefs_INI]Fallout 4's[/url] *Prefs.ini files.[/size]\n<br />[*][size=3][url=https://www.nexusmods.com/fallout76/mods/593]Fafla McDafla's C.G.B.V.P.T.I.T.O.M[/url][/size]\n<br />[*][size=3][url=https://fallout.fandom.com/wiki/User:Eckserah/IniSettings]IniSettings article in the Fallout wiki by Eckserah[/url][/size]\n<br />[*][size=3]u/LinuxVersion's Reddit post: [url=https://www.reddit.com/r/fo76/comments/p48a25/obtain_all_3017_ini_settings_with_default_values/]Obtain all 3017 INI settings with default values...[/url] | [url=https://docs.google.com/spreadsheets/d/1DFkbE-_8PXiW0r4DrGQGs-QFJELleIkr-mrQUMxpw7o/edit?usp=sharing](very useful spreadsheet)[/url][/size]\n<br />[*][size=3][size=3]u/[/size]derpderp3200's Reddit post: [url=https://www.reddit.com/r/fo76/comments/9u4urf/psa_how_to_actually_disable_depth_of_field_and/]\"How to actually disable Depth of Field, and how to go from 20fps to 60fps\"[/url][/size]\n<br />[*][size=3]Trankquel's forum thread: [url=https://forums.nexusmods.com/index.php?/topic/3401795-an-analysis-of-mouse-input-and-related-ini-variables/]\"An Analysis of Mouse Input and Related INI Variables\"[/url][/size]\n<br />[*][size=3]DoubleYou's forum thread: [url=https://forum.step-project.com/topic/9209-sun-shadow-transition-ini-settings/]\"Sun Shadow Transition INI Settings\"[/url][/size]\n<br />[*][size=3][size=3]u/[/size]Xabraxxis's Reddit post: [url=https://www.reddit.com/r/fo76/comments/e33hpj/fallout_76_ini_file_and_performance_tweaks_with/]\"Fallout 76 ini file and performance tweaks with full details on what they do.\"[/url][/size]\n<br />[*][size=3]Gabi's forum thread: [url=https://steamcommunity.com/sharedfiles/filedetails/?id=551069501]\"Unlock Frame Rate, Change FOV, Skip Intro Video, Unlock Console, 21:9 Support and Remove Mouse Smoothing + Other Fixes\"[/url][/size]\n<br />[*][size=3]Jolu42's forum thread: [url=https://steamcommunity.com/app/1151340/discussions/0/2259061617881806276/]\"Fallout76Custom.ini (Make the game look better, run smoother)\"[/url][/size]\n<br />[*][size=3][size=3]u/[/size]Z0MG_H4X's Reddit post: [url=https://www.reddit.com/r/fo76/comments/ai6o3t/pc_useful_ini_settings_everyone_should_check_out/]\"[PC] Useful ini Settings Everyone Should Check Out\"[/url][/size]\n<br />[*][size=3][size=3]u/[/size]Aten_Ra's Reddit post: [url=https://www.reddit.com/r/fo76/comments/cb43a7/guide_how_to_run_multiple_instances_of_76_on_a/]\"[Guide] How to Run Multiple Instances of ’76 on a single computer.\"[/url][/size]\n<br />[*][size=3]u/Doppler5hift's Reddit post: [url=https://www.reddit.com/r/fo76/comments/ues8vv/solved_how_to_run_two_fallout_76_characters/]\"Solved: how to run two Fallout 76 characters simultaneously using Steam\"[/url][/size]\n<br />[/list][size=3]\n<br />[size=4][b][color=FFD083]Contributors:[/color][/b][/size]\n<br />[/size][list]\n<br />[*][size=3][url=https://www.nexusmods.com/fallout76/users/3166296]QuadroTony[/url]: A lot of bug reports, and ideas, as well as: bSkipSplash=1 disables the news splash on startup[/size]\n<br />[*][size=3][url=https://www.nexusmods.com/fallout76/users/2781727]infinitywulf[/url]: Changing the color of the power armor Pip-Boy[/size]\n<br />[*][size=3][url=https://www.nexusmods.com/fallout76/users/3557603]Juinchi [/url]and [url=https://www.nexusmods.com/fallout76/users/23655354]Jolu42[/url]: TAA sharpening[/size]\n<br />[*][size=3][url=https://www.nexusmods.com/users/1975046]toarullen[/url]: bShowCompass[/size]\n<br />[*][size=3][url=https://www.nexusmods.com/users/65898136]Eckserah[/url]: A lot of valuable information as well as providing default *.ini values[/size]\n<br />[*][size=3][url=https://www.nexusmods.com/users/4382192]bolbman[/url]: Pip-Boy resolution, camera tweaks[/size]\n<br />[*][size=3][url=https://www.nexusmods.com/fallout76/users/23602379]ei8htzer0[/url]: Login credentials (s76UserName, s76Password)[/size]\n<br />[*][size=3][url=https://www.nexusmods.com/fallout76/users/3009582]zingmars[/url]: A lot of bug reports and ideas[/size]\n<br />[*][size=3][url=https://www.nexusmods.com/users/42523000]dutem[/url] and [url=https://www.nexusmods.com/users/11380513]ZeroByDivide[/url]: Brought Xbox Game Pass to my attention[/size]\n<br />[*][size=3][url=https://www.nexusmods.com/users/1838494]Deadmano[/url]: QoL improvement ideas and \"bSteamEnabled=0\" tweak[/size]\n<br />[*][size=3][url=https://www.nexusmods.com/fallout76/users/27163]Pacoboyd[/url]: Advice, ideas, and \"bAutoSignin=1\" tweak [/size]\n<br />[/list][size=3][b]\n<br />[size=4][color=FFD083]Translators:[/color][/size][/b][/size][list]\n<br />[*][size=3]Russian by [url=https://forums.nexusmods.com/index.php?/user/6969601-sondju/]Sondju[/url][/size]\n<br />[*][size=3]Italian for v1.12 by [url=https://forums.nexusmods.com/index.php?/user/39134360-roger08/]Roger08[/url]﻿[/size]\n<br />[*][size=3]Spanish for v1.12 by [url=https://forums.nexusmods.com/index.php?/user/2229355-yllelder/]Yllelder[/url][/size]\n<br />[*][size=3]Japanese for v1.11.3 by [url=https://forums.nexusmods.com/index.php?/user/6598456-yuutarionn/]Akamiso0123 (yuutarionn)[/url][/size]\n<br />[*][size=3]Chinese for v1.12.8 by [url=https://forums.nexusmods.com/index.php?/user/90175763-bulaluka/]SugarBombsRADS[/url][/size]\n<br />[/list]\n<br />[b][size=3]Outdated translations:[/size][/b]\n<br />[list]\n<br />[*][size=3]Swedish for v1.5.2 by [url=https://forums.nexusmods.com/index.php?/user/634766-pforga/]Pforga[/url][/size]\n<br />[*][size=3]French for v1.6.2 by Christophe Noret (aka. [url=https://www.nexusmods.com/fallout76/users/22658164]kr1ss[/url]) and [url=https://forums.nexusmods.com/index.php?/user/26975924-3z3k3yl/]3z3k3yl[/url][/size]\n<br />[*][size=3]Brazilian Portuguese for v1.8.4h1 by [url=https://forums.nexusmods.com/index.php?/user/2944752-oruam/]Oruam[/url][/size]\n<br />[*][size=3]Japanese for v1.9.0h2 by [url=https://forums.nexusmods.com/index.php?/user/59398041-haiji951753/]haiji951753[/url][/size]\n<br />[*][size=3]Polish for v1.9.2 by [url=https://forums.nexusmods.com/index.php?/user/91201958-gray770/]Gray770[/url][/size]\n<br />[*][size=3]Chinese[/size]\n<br />[list]\n<br />[*][size=3]for v1.6.2 by [url=https://forums.nexusmods.com/index.php?/user/68821693-broodahood/]Broodahood[/url][/size]\n<br />[*][size=3]for v1.8.2 by [url=https://www.nexusmods.com/users/97619783]micus2048[/url][/size]\n<br />[*][size=3]for v1.9.5 by [url=https://forums.nexusmods.com/index.php?/user/91571998-colanaramon/]ColaNaramon (可乐の魂)[/url][/size]\n<br />[/list][/list]",
          "picture_url": "https://staticdelivery.nexusmods.com/mods/2590/images/546/546-1654537179-893568444.png",
          "mod_downloads": 311449,
          "mod_unique_downloads": 154101,
          "uid": 11123965297186,
          "mod_id": 546,
          "game_id": 2590,
          "allow_rating": true,
          "domain_name": "fallout76",
          "category_id": 6,
          "version": "1.12.8",
          "endorsement_count": 7442,
          "created_timestamp": 1586526633,
          "created_time": "2020-04-10T13:50:33.000+00:00",
          "updated_timestamp": 1753040884,
          "updated_time": "2025-07-20T19:48:04.000+00:00",
          "author": "FelisDiligens",
          "uploaded_by": "FelisDiligens",
          "uploaded_users_profile_url": "https://www.nexusmods.com/users/41275740",
          "contains_adult_content": false,
          "status": "published",
          "available": true,
          "user": {
            "member_id": 41275740,
            "member_group_id": 27,
            "name": "FelisDiligens"
          },
          "endorsement": {
            "endorse_status": "Undecided",
            "timestamp": null,
            "version": null
          }
        }
    "#};
    let result: Result<ModInfo, serde_json::Error> = serde_json::from_str(test_str);
    assert!(result.is_ok(), "{}", result.unwrap_err());

    let mod_info: ModInfo = result.unwrap();
    assert_eq!(mod_info.mod_id, 546);
    assert_eq!(mod_info.domain_name, "fallout76");
    assert_eq!(mod_info.contains_adult_content, false);
    assert_eq!(
        mod_info.name,
        "Fallout 76 Quick Configuration - INI-Editor and Mod Manager"
    );
    assert_eq!(mod_info.version, "1.12.8");
    assert_eq!(mod_info.author, "FelisDiligens");
    assert_eq!(mod_info.uploaded_by, "FelisDiligens");
    assert_eq!(mod_info.endorsement_count, 7442);
    assert_eq!(mod_info.created_timestamp, 1586526633);
    assert_eq!(mod_info.updated_timestamp, 1753040884);
    assert_eq!(
        mod_info.endorsement.endorse_status,
        EndorseStatus::Undecided
    );
    assert_eq!(
        mod_info.summary,
        "This tool allows you to tweak *.ini settings and install mods."
    );
    assert_eq!(
        mod_info.picture_url,
        "https://staticdelivery.nexusmods.com/mods/2590/images/546/546-1654537179-893568444.png"
    );
}

#[test]
fn test_download_links_json_load() {
    let test_str = indoc! {r#"
        [
          {
            "name": "Nexus Global Content Delivery Network",
            "short_name": "Nexus CDN",
            "URI": "https://cf-files.nexusmods.com/cdn/2590/546/Quick Configuration v1.12.9-546-v1-12-9-1753040884.zip?md5=zDc-PAn46WqbiFznKFXIEA&expires=1777734522&user_id=41275740"
          },
          {
            "name": "Amsterdam (Premium)",
            "short_name": "Amsterdam",
            "URI": "https://amsterdam-premium.nexus-cdn.com/2590/546/Quick Configuration v1.12.9-546-v1-12-9-1753040884.zip?md5=zDc-PAn46WqbiFznKFXIEA&expires=1777734522&user_id=41275740"
          },
          {
            "name": "Prague (Premium)",
            "short_name": "Prague",
            "URI": "https://prague-premium.nexus-cdn.com/2590/546/Quick Configuration v1.12.9-546-v1-12-9-1753040884.zip?md5=zDc-PAn46WqbiFznKFXIEA&expires=1777734522&user_id=41275740"
          },
          {
            "name": "Chicago (Premium)",
            "short_name": "Chicago",
            "URI": "https://chicago-premium.nexus-cdn.com/2590/546/Quick Configuration v1.12.9-546-v1-12-9-1753040884.zip?md5=zDc-PAn46WqbiFznKFXIEA&expires=1777734522&user_id=41275740"
          },
          {
            "name": "Los Angeles (Premium)",
            "short_name": "Los Angeles",
            "URI": "https://la-premium.nexus-cdn.com/2590/546/Quick Configuration v1.12.9-546-v1-12-9-1753040884.zip?md5=zDc-PAn46WqbiFznKFXIEA&expires=1777734522&user_id=41275740"
          },
          {
            "name": "Miami (Premium)",
            "short_name": "Miami",
            "URI": "https://miami-premium.nexus-cdn.com/2590/546/Quick Configuration v1.12.9-546-v1-12-9-1753040884.zip?md5=wG8SFcS9YQEDI1pg3rFqtQ&expires=1777734523&user_id=41275740"
          },
          {
            "name": "Dallas (Premium)",
            "short_name": "Dallas",
            "URI": "https://dallas-premium.nexus-cdn.com/2590/546/Quick Configuration v1.12.9-546-v1-12-9-1753040884.zip?md5=wG8SFcS9YQEDI1pg3rFqtQ&expires=1777734523&user_id=41275740"
          }
        ]
    "#};
    let result: Result<Vec<DownloadLink>, serde_json::Error> = serde_json::from_str(test_str);
    assert!(result.is_ok(), "{}", result.unwrap_err());

    let download_links: Vec<DownloadLink> = result.unwrap();
    assert_eq!(download_links.len(), 7);

    let first = &download_links[0];
    assert_eq!(first.name, "Nexus Global Content Delivery Network");
    assert_eq!(first.short_name, "Nexus CDN");
    assert_eq!(
        first.uri,
        "https://cf-files.nexusmods.com/cdn/2590/546/Quick Configuration v1.12.9-546-v1-12-9-1753040884.zip?md5=zDc-PAn46WqbiFznKFXIEA&expires=1777734522&user_id=41275740"
    );

    let last = &download_links[6];
    assert_eq!(last.name, "Dallas (Premium)");
    assert_eq!(last.short_name, "Dallas");
    assert_eq!(
        last.uri,
        "https://dallas-premium.nexus-cdn.com/2590/546/Quick Configuration v1.12.9-546-v1-12-9-1753040884.zip?md5=wG8SFcS9YQEDI1pg3rFqtQ&expires=1777734523&user_id=41275740"
    );
}

#[test]
fn test_mod_files_json_load() {
    let test_str = indoc! {r#"
        {
          "file_updates": [
            {
              "old_file_id": 3163,
              "new_file_id": 3188,
              "old_file_name": "Quick Configuration v1.0-546-1-0-1586525804.zip",
              "new_file_name": "Quick Configuration v1.1-546-1-1-1586569168.zip",
              "uploaded_timestamp": 1586569168,
              "uploaded_time": "2020-04-11T01:39:28.000+00:00"
            }
          ],
          "files": [
            {
              "id": [
                17669,
                2590
              ],
              "uid": 11123965314309,
              "file_id": 17669,
              "name": "Quick Configuration v1.12.9",
              "version": "v1.12.9",
              "category_id": 1,
              "category_name": "MAIN",
              "is_primary": false,
              "size": 21477,
              "file_name": "Quick Configuration v1.12.9-546-v1-12-9-1753040884.zip",
              "uploaded_timestamp": 1753040884,
              "uploaded_time": "2025-07-20T19:48:04.000+00:00",
              "mod_version": "v1.12.9",
              "external_virus_scan_url": "https://www.virustotal.com/gui/file/96136360450148f6f62d0a68b0f342d2b4f7e8ae05b2c24f9f2f4ef2fdf03823/detection/f-96136360450148f6f62d0a68b0f342d2b4f7e8ae05b2c24f9f2f4ef2fdf03823-1753040891",
              "description": "Portable, *.zip\n<br />\n<br />(Setup available on GitHub mirror)",
              "size_kb": 21477,
              "size_in_bytes": 21992914,
              "changelog_html": null,
              "content_preview_link": "https://file-metadata.nexusmods.com/file/nexus-files-s3-meta/2590/546/Quick Configuration v1.12.9-546-v1-12-9-1753040884.zip.json"
            }
          ]
        }
    "#};
    let result: Result<ModFiles, serde_json::Error> = serde_json::from_str(test_str);
    assert!(result.is_ok(), "{}", result.unwrap_err());

    let mod_files: ModFiles = result.unwrap();
    assert_eq!(mod_files.file_updates.len(), 1);
    assert_eq!(mod_files.files.len(), 1);

    let file_update = &mod_files.file_updates[0];
    assert_eq!(file_update.old_file_id, 3163);
    assert_eq!(file_update.new_file_id, 3188);
    assert_eq!(
        file_update.old_file_name,
        "Quick Configuration v1.0-546-1-0-1586525804.zip"
    );
    assert_eq!(
        file_update.new_file_name,
        "Quick Configuration v1.1-546-1-1-1586569168.zip"
    );
    assert_eq!(file_update.uploaded_timestamp, 1586569168);

    let mod_file = &mod_files.files[0];
    assert_eq!(mod_file.id, vec![17669, 2590]);
    assert_eq!(mod_file.uid, 11123965314309);
    assert_eq!(mod_file.file_id, 17669);
    assert_eq!(mod_file.name, "Quick Configuration v1.12.9");
    assert_eq!(mod_file.version, "v1.12.9");
    assert_eq!(mod_file.category_id, 1);
    assert_eq!(mod_file.category_name, "MAIN");
    assert_eq!(mod_file.is_primary, false);
    assert_eq!(mod_file.size, 21477);
    assert_eq!(
        mod_file.file_name,
        "Quick Configuration v1.12.9-546-v1-12-9-1753040884.zip"
    );
    assert_eq!(mod_file.uploaded_timestamp, 1753040884);
    assert_eq!(mod_file.mod_version, "v1.12.9");
    assert_eq!(
        mod_file.external_virus_scan_url,
        Some("https://www.virustotal.com/gui/file/96136360450148f6f62d0a68b0f342d2b4f7e8ae05b2c24f9f2f4ef2fdf03823/detection/f-96136360450148f6f62d0a68b0f342d2b4f7e8ae05b2c24f9f2f4ef2fdf03823-1753040891".to_string())
    );
    assert!(
        mod_file
            .description
            .contains("Portable, *.zip\n<br />\n<br />(Setup available on GitHub mirror)")
    );
    assert_eq!(mod_file.size_kb, 21477);
    assert_eq!(mod_file.size_in_bytes, 21992914);
    assert_eq!(mod_file.changelog_html, None);
    assert_eq!(
        mod_file.content_preview_link,
        Some("https://file-metadata.nexusmods.com/file/nexus-files-s3-meta/2590/546/Quick Configuration v1.12.9-546-v1-12-9-1753040884.zip.json".to_string())
    );
}

#[test]
fn test_file_category() {
    assert_eq!(FileCategory::Main.to_string(), "main");
    assert_eq!(FileCategory::Update.to_string(), "update");
    assert_eq!(FileCategory::Optional.to_string(), "optional");
    assert_eq!(FileCategory::OldVersion.to_string(), "old_version");
    assert_eq!(FileCategory::Miscellaneous.to_string(), "miscellaneous");
}
