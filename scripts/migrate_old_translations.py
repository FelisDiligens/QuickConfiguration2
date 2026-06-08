"""Work in progress"""

import json
import os
from pathlib import Path

from lxml import etree


def xpath_get(element, path):
    """Wrapper around xpath method for safe access of a single element"""
    if element is None:
        return None
    found = element.xpath(path)
    if len(found) == 0:
        return None
    return found[0]


def xpath_get_by_id(element, path, id):
    return xpath_get(element, path + '[@id="' + id + '"]')


def xpath_getattr(element, path, attribute):
    found = xpath_get(element, path)
    if found is None:
        return None
    return found.get(attribute)


def xpath_getattr_by_id(element, path, id, attribute):
    found = xpath_get_by_id(element, path, id)
    if found is None:
        return None
    return found.get(attribute)


def xpath_gettext_by_id(element, path, id):
    return xpath_getattr_by_id(element, path, id, "text")


def new_translation(language: str, english: str, german: str) -> str | None:
    """Use this function if the string is new and does not exist in the old translation files."""
    if language == "en-US":
        return english
    elif language == "de-DE":
        return german
    else:
        return None


def updated_translation(language: str, original: str | None, english: str, german: str) -> str | None:
    """Use this function if the string has been updated and does not match the one in the old translation files."""
    if language == "en-US":
        return english
    elif language == "de-DE":
        return german
    else:
        return original


def and_then(callback, maybe_none):
    """Executes callback if `maybe_none` is not None, otherwise returns None"""
    if maybe_none is None:
        return None
    return callback(maybe_none)


def map_common(root, language):
    strings = xpath_get(root, ".//Strings")
    form_welcome = xpath_get(root, ".//FormWelcome")

    return {
        "common": {
            "yes": xpath_gettext_by_id(strings, ".//String", "yes"),
            "no": xpath_gettext_by_id(strings, ".//String", "no"),
            "ok": xpath_gettext_by_id(form_welcome, ".//Button", "buttonOK"),
            "autoDetect": new_translation(
                language, "Auto-detect", "Automatisch erkennen"
            ),
            "autoDetectPathButton": xpath_gettext_by_id(
                form_welcome, ".//Panel//Button", "buttonAutoDetect"
            ),
            "unknown": xpath_gettext_by_id(strings, ".//String", "unknown"),
            "loading": new_translation(
                language,
                "Loading",
                "Laden",
            ),
            "error": new_translation(
                language,
                "Error",
                "Fehler",
            ),
            "saveButton": xpath_gettext_by_id(
                root, ".//Form1//UserControlCustom/Button", "buttonCustomSave"
            ),
            "resetButton": xpath_gettext_by_id(
                root, ".//FormMods//Button", "buttonModsResetTextbox"
            ),
            "chooseFolderButton": new_translation(
                language, "Choose folder", "Ordner wählen"
            ),
        }
    }


def map_navigation(root, language):
    side_nav = xpath_get_by_id(
        root, ".//Form1/UserControlSideNav", "userControlSideNav"
    )
    browse_menu = xpath_get_by_id(
        root, ".//Form1/ContextMenuStrip", "contextMenuStripBrowse"
    )

    return {
        "navigation": {
            "quickConfiguration": xpath_gettext_by_id(
                side_nav, ".//Label", "labelLogo"
            ),
            "playButton": xpath_gettext_by_id(
                side_nav, ".//StyledButton", "buttonPlay"
            ),
            # "applyButton": xpath_gettext_by_id(
            #     side_nav, ".//StyledButton", "buttonApply"
            # ),
            "browseButton": updated_translation(
                language,
                xpath_gettext_by_id(side_nav, ".//StyledButton", "buttonBrowse"),
                "Browse",
                "Durchsuchen",
            ),
            "browse": {
                "gameInstallationFolder": xpath_gettext_by_id(
                    browse_menu, ".//ToolStripMenuItem", "gameFolderToolStripMenuItem"
                ),
                "gameConfigurationFolder": updated_translation(
                    language,
                    xpath_gettext_by_id(
                        browse_menu,
                        ".//ToolStripMenuItem",
                        "gamesConfigurationFolderToolStripMenuItem",
                    ),
                    "Game configuration folder",
                    "Spielkonfigurationsordner",
                ),
                "appInstallationFolder": updated_translation(
                    language,
                    xpath_gettext_by_id(
                        browse_menu,
                        ".//ToolStripMenuItem",
                        "toolInstallationFolderToolStripMenuItem",
                    ),
                    "App installation folder",
                    "Appinstallationsordner",
                ),
                "appConfigurationFolder": updated_translation(
                    language,
                    xpath_gettext_by_id(
                        browse_menu,
                        ".//ToolStripMenuItem",
                        "toolConfigurationFolderToolStripMenuItem",
                    ),
                    "App configuration folder",
                    "Appkonfigurationordner",
                ),
                "steamScreenshotsFolder": updated_translation(
                    language,
                    xpath_gettext_by_id(
                        browse_menu,
                        ".//ToolStripMenuItem",
                        "steamScreenshotFolderToolStripMenuItem",
                    ),
                    "Steam screenshots folder",
                    "Steams Screenshotsordner",
                ),
                "gamePhotosFolder": xpath_gettext_by_id(
                    browse_menu,
                    ".//ToolStripMenuItem",
                    "gamePhotosFolderToolStripMenuItem",
                ),
                "editIniFile": and_then(
                    lambda s: s.replace("Fallout76.ini", "{{file}}"),
                    xpath_gettext_by_id(
                        browse_menu,
                        ".//ToolStripMenuItem",
                        "editFallout76iniToolStripMenuItem",
                    ),
                ),
            },
            "homePage": xpath_gettext_by_id(side_nav, ".//StyledButton", "buttonHome"),
            "tweaksPage": xpath_gettext_by_id(
                side_nav, ".//StyledButton", "buttonTweaks"
            ),
            "pipboyPage": xpath_gettext_by_id(
                side_nav, ".//StyledButton", "buttonPipboy"
            ),
            "modsPage": xpath_gettext_by_id(side_nav, ".//StyledButton", "buttonMods"),
            "galleryPage": xpath_gettext_by_id(
                side_nav, ".//StyledButton", "buttonGallery"
            ),
            "settingsPage": xpath_gettext_by_id(
                side_nav, ".//StyledButton", "buttonSettings"
            ),
            "nexusmodsPage": xpath_gettext_by_id(
                side_nav, ".//StyledButton", "buttonNexusMods"
            ),
            "selectedProfile": xpath_gettext_by_id(
                side_nav, ".//Label", "labelGameEditionDesc"
            ),
        }
    }


def map_home(root, language):
    strings = xpath_get(root, ".//Strings")
    home_page = xpath_get(root, ".//Form1//UserControlHome")
    title_panel = xpath_get_by_id(home_page, ".//Panel", "panelTitle")
    update_panel = xpath_get_by_id(home_page, ".//Panel", "panelUpdate")

    return {
        "home": {
            "title": xpath_gettext_by_id(title_panel, ".//Label", "labelWelcome"),
            "subtitle": xpath_gettext_by_id(
                title_panel, ".//Label", "labelDescription"
            ),
            "version": and_then(
                lambda s: s.rstrip(":"),
                xpath_gettext_by_id(home_page, ".//Label", "labelVersion"),
            ),
            "serverStatus": {
                "label": and_then(
                    lambda s: s.rstrip(":"),
                    xpath_gettext_by_id(home_page, ".//Label", "labelServerStatus"),
                ),
                "refresh": new_translation(
                    language, "Click to refresh", "Klicke zum Neuladen"
                ),
                "loading": new_translation(language, "Loading...", "Laden..."),
                "error": new_translation(
                    language,
                    "Error occured while loading",
                    "Fehler beim Laden aufgetreten",
                ),
            },
            "author": and_then(
                lambda s: s.rstrip(":"),
                xpath_gettext_by_id(home_page, ".//Label", "labelAuthor"),
            ),
            "translationAuthor": and_then(
                lambda s: s.rstrip(":"),
                xpath_gettext_by_id(home_page, ".//Label", "labelTranslationBy"),
            ),
            "whatsNew": xpath_gettext_by_id(
                home_page, ".//StyledButton", "styledButtonWhatsNew"
            ),
            "goBack": xpath_gettext_by_id(
                home_page, ".//StyledButton", "styledButtonGoBack"
            ),
            "links": {
                "title": xpath_gettext_by_id(home_page, ".//Label", "labelWebLinks"),
                "nexusmods": xpath_gettext_by_id(
                    home_page, ".//StyledButton", "styledButtonNexusMods"
                ),
                "github": xpath_gettext_by_id(
                    home_page, ".//StyledButton", "styledButtonGitHub"
                ),
                "wiki": xpath_gettext_by_id(
                    home_page, ".//StyledButton", "styledButtonWikiAndGuides"
                ),
                "bugs": xpath_gettext_by_id(
                    home_page, ".//StyledButton", "styledButtonBugReports"
                ),
                "bethesdaNetStatus": xpath_gettext_by_id(
                    home_page, ".//StyledButton", "styledButtonBethesdaNetStatus"
                ),
                "nukesAndDragonsBuildPlanner": xpath_gettext_by_id(
                    home_page,
                    ".//StyledButton",
                    "styledButtonNukesAndDragonsBuildPlanner",
                ),
                "nukacrypt": xpath_gettext_by_id(
                    home_page, ".//StyledButton", "styledButtonNukacrypt"
                ),
                "map76": xpath_gettext_by_id(
                    home_page, ".//StyledButton", "styledButtonMap76"
                ),
                "xTranslator": xpath_gettext_by_id(
                    home_page, ".//StyledButton", "styledButtonxTranslator"
                ),
            },
            "update": {
                "button": xpath_gettext_by_id(
                    update_panel, ".//PictureBoxButton", "pictureBoxButtonUpdate"
                ),
                "text": and_then(
                    lambda s: s.replace("{0}", "{{version}}"),
                    xpath_gettext_by_id(strings, ".//String", "newVersionAvailable"),
                ),
                "link": xpath_gettext_by_id(
                    update_panel, ".//LinkLabel", "linkLabelManualDownloadPage"
                ),
            },
        },
    }


def map_tweaks(root, language):
    tweaks_page = xpath_get(root, ".//Form1//UserControlTweaks")
    general_tab = xpath_get_by_id(tweaks_page, ".//StyledTabControl//TabPage", "tabPageGeneral")
    video_tab = xpath_get_by_id(tweaks_page, ".//StyledTabControl//TabPage", "tabPageVideo")
    audio_tab = xpath_get_by_id(tweaks_page, ".//StyledTabControl//TabPage", "tabPageAudio")
    controls_tab = xpath_get_by_id(tweaks_page, ".//StyledTabControl//TabPage", "tabPageControls")
    camera_tab = xpath_get_by_id(tweaks_page, ".//StyledTabControl//TabPage", "tabPageCamera")
    accessibility_tab = xpath_get_by_id(tweaks_page, ".//StyledTabControl//TabPage", "tabPageAccessibility")

    return {
        "tweaks": {
            "general": {
                "title": and_then(lambda x: x.get("text"), general_tab)
            },
            "video": {
                "title": and_then(lambda x: x.get("text"), video_tab)
            },
            "audio": {
                "title": and_then(lambda x: x.get("text"), audio_tab)
            },
            "controls": {
                "title": and_then(lambda x: x.get("text"), controls_tab)
            },
            "camera": {
                "title": and_then(lambda x: x.get("text"), camera_tab)
            },
            "accessibility": {
                "title": and_then(lambda x: x.get("text"), accessibility_tab)
            },
        },
    }


def map_pipboy(root, language):
    return {
        "pipboy": {},
    }


def map_mods(root, language):
    return {
        "mods": {},
    }


def map_gallery(root, language):
    strings = xpath_get(root, ".//Strings")
    gallery_page = xpath_get(root, ".//Form1//UserControlGallery")

    return {
        "gallery": {
            "title": updated_translation(
                language,
                xpath_gettext_by_id(gallery_page, ".//Label", "labelGalleryTitle"),
                "Gallery",
                "Galerie",
            ),
            "noImagesFound": new_translation(
                language,
                "No images found",
                "Keine Bilder gefunden",
            ),
        }
    }


def map_welcome(root, language):
    form_welcome = xpath_get(root, ".//FormWelcome")

    return {
        "welcome": {
            "title": xpath_gettext_by_id(form_welcome, ".//Label", "labelTitle"),
            "subtitle": and_then(
                lambda s: s.replace("\\n", "\n").strip(),
                xpath_gettext_by_id(form_welcome, ".//Label", "label1"),
            ),
            "quote": {
                "text": and_then(
                    lambda s: (
                        "\n".join(
                            map(
                                lambda s: s.strip(),
                                s.replace("\\n", "\n").split("\n"),
                            )
                        )
                        .replace("»", "")
                        .replace("«", "")
                        .split("–")[0]
                        .strip()
                    ),
                    xpath_gettext_by_id(form_welcome, ".//Label", "label4"),
                ),
                "rep": and_then(
                    lambda s: s.split("–")[1].strip(),
                    xpath_gettext_by_id(form_welcome, ".//Label", "label4"),
                ),
            },
            "getStarted": new_translation(
                language,
                "Get started",
                "Loslegen",
            ),
        },
    }


def map_settings(root, language):
    settings_page = xpath_get(root, ".//Form1//UserControlSettings")

    return {
        "settings": {
            "title": xpath_gettext_by_id(
                settings_page, ".//Label", "labelSettingsTitle"
            ),
            "localization": {
                "title": updated_translation(
                    language,
                    xpath_gettext_by_id(
                        settings_page, ".//Panel//Label", "labelSettingsLocalization"
                    ),
                    "Localization",
                    "Lokalisation",
                ),
                "language": and_then(
                    lambda s: s.rstrip(":"),
                    xpath_gettext_by_id(
                        settings_page, ".//Panel//Label", "labelLanguage"
                    ),
                ),
            },
            "theme": {
                "title": and_then(
                    lambda s: s.rstrip(":"),
                    xpath_gettext_by_id(settings_page, ".//Panel//Label", "labelTheme"),
                ),
                "light": xpath_gettext_by_id(
                    settings_page, ".//Panel//RadioButton", "radioButtonLightTheme"
                ),
                "dark": xpath_gettext_by_id(
                    settings_page, ".//Panel//RadioButton", "radioButtonDarkTheme"
                ),
                "system": xpath_gettext_by_id(
                    settings_page,
                    ".//Panel//RadioButton",
                    "radioButtonRespectSystemTheme",
                ),
            },
            "appearance": {
                "title": xpath_gettext_by_id(
                    settings_page, ".//Panel//Label", "labelAppearance"
                ),
                "useGameCursor": new_translation(
                    language,
                    "Use game cursor",
                    "Spielcursor verwenden",
                ),
            },
            "behavior": {
                "title": xpath_gettext_by_id(
                    settings_page, ".//Panel//Label", "labelSettingsBehavior"
                ),
                "fetchServerStatusOnStart": new_translation(
                    language,
                    "Fetch server status on start",
                    "Serverstatus beim Start abrufen",
                ),
                "fetchServerStatusOnStartSubtitle": new_translation(
                    language,
                    "Contacts status.bethesda.net and api.locize.app to display the status",
                    "Kontaktiert status.bethesda.net und api.locize.app um den Status anzuzeigen",
                ),
            },
            "profiles": {
                "title": updated_translation(
                    language,
                    xpath_gettext_by_id(
                        settings_page, ".//Panel//Label", "labelSettingsProfiles"
                    ),
                    "Profiles",
                    "Profile",
                ),
                "subtitle": updated_translation(
                    language,
                    xpath_gettext_by_id(
                        settings_page, ".//Panel//Label", "labelSettingsProfileNotice"
                    ),
                    "Looking for profile settings? (Game path, game edition, etc.)",
                    "Suchst du nach Profil-Einstellungen? (Spielpfad, Spieledition, etc.)",
                ),
                "goToProfiles": and_then(
                    lambda s: s.rstrip("→").strip(),
                    xpath_gettext_by_id(
                        settings_page,
                        ".//Panel//LinkLabel",
                        "linkLabelOpenProfileEditor",
                    ),
                ),
            },
        },
    }


def map_profiles(root, language):
    form_welcome = xpath_get(root, ".//FormWelcome")
    profiles_page = xpath_get(root, ".//Form1//UserControlProfiles")

    return {
        "profiles": {
            "title": xpath_gettext_by_id(profiles_page, ".//Label", "labelSelectTitle"),
            "addButton": xpath_gettext_by_id(
                profiles_page, ".//Button", "buttonAddProfile"
            ),
            "editButton": xpath_gettext_by_id(
                profiles_page, ".//Button", "buttonEditProfile"
            ),
            "deleteButton": xpath_gettext_by_id(
                profiles_page, ".//Button", "buttonDeleteProfile"
            ),
            "confirmDeleteDialog": {
                "title": new_translation(
                    language,
                    'Delete profile "{{profile}}"?',
                    'Profil "{{profile}}" löschen?',
                ),
                "text": new_translation(
                    language,
                    'You\'re about to delete "{{profile}}".\nAre you sure?',
                    'Du bist dabei "{{profile}}" zu löschen.\nBist du sicher?',
                ),
            },
            "editProfile": xpath_gettext_by_id(
                profiles_page,
                ".//Label",
                "labelEditTitle",
            ),
            "profileName": and_then(
                lambda s: s.rstrip(":"),
                xpath_gettext_by_id(
                    profiles_page,
                    ".//Label",
                    "labelProfileName",
                ),
            ),
            "advancedOptions": xpath_gettext_by_id(
                profiles_page,
                ".//Label",
                "labelProfileAdvancedOptions",
            ),
            "gameEdition": {
                "title": xpath_gettext_by_id(
                    form_welcome, ".//GroupBox", "groupBoxGameEdition"
                ),
                "subtitle": new_translation(
                    language,
                    "Where did you buy the game?",
                    "Wo hast du das Spiel gekauft?",
                ),
                "steam": xpath_gettext_by_id(
                    form_welcome, ".//RadioButton", "radioButtonEditionSteam"
                ),
                "steamPTS": xpath_gettext_by_id(
                    form_welcome, ".//RadioButton", "radioButtonEditionSteamPTS"
                ),
                "xbox": xpath_gettext_by_id(
                    form_welcome, ".//RadioButton", "radioButtonEditionMSStore"
                ),
                "other": updated_translation(
                    language,
                    xpath_gettext_by_id(
                        form_welcome, ".//RadioButton", "radioButtonEditionUnknown"
                    ),
                    "Something else",
                    "Etwas anderes",
                ),
            },
            "gamePath": {
                "title": xpath_gettext_by_id(
                    form_welcome, ".//GroupBox", "groupBoxGameLocation"
                ),
                "subtitle": new_translation(
                    language,
                    "Needed if you want to mod the game.",
                    "Wird benötigt, wenn du das Spiel modden möchtest.",
                ),
                "clickForTip": new_translation(
                    language,
                    "Click here, if you have difficulty to find the game path.",
                    "Klick hier, wenn du Schwierigkeiten hast den Spielpfad zu finden.",
                ),
            },
            "modsPath": {
                "title": and_then(
                    lambda s: s.rstrip(":"),
                    xpath_gettext_by_id(
                        profiles_page,
                        ".//Label",
                        "labelModsPath",
                    ),
                ),
                "subtitle": new_translation(
                    language,
                    "Where to store mod files?",
                    "Wohin kommen die Moddateien?",
                ),
            },
            "configFiles": {
                "title": new_translation(
                    language,
                    "Config files",
                    "Konfigurationsdateien",
                ),
                "subtitle": new_translation(
                    language,
                    "Don't change if unsure.",
                    "Nicht ändern, wenn du dir unsicher bist.",
                ),
                "iniPrefix": and_then(
                    lambda s: s.rstrip(":"),
                    xpath_gettext_by_id(
                        profiles_page,
                        ".//Label",
                        "labelIniPrefix",
                    ),
                ),
                "iniParentPath": updated_translation(
                    language,
                    and_then(
                        lambda s: s.rstrip(":"),
                        xpath_gettext_by_id(profiles_page, ".//Label", "labelIniPath"),
                    ),
                    "*.ini parent path",
                    "*.ini Ordnerpfad",
                ),
            },
            "launchOptions": {
                "title": xpath_gettext_by_id(
                    profiles_page,
                    ".//Label",
                    "labelProfileLaunchOptions",
                ),
                "subtitle": new_translation(
                    language,
                    "Used when launching the game through the app.",
                    "Wird verwendet, wenn das Spiel über die App gestartet wird.",
                ),
                "launchWithLauncher": xpath_gettext_by_id(
                    profiles_page, ".//RadioButton", "radioButtonLaunchViaLink"
                ),
                "runExecutableDirectly": updated_translation(
                    language,
                    xpath_gettext_by_id(
                        profiles_page,
                        ".//RadioButton",
                        "radioButtonLaunchViaExecutable",
                    ),
                    "Run executable directly",
                    "Starte ausführbare Datei direkt",
                ),
                "executableFile": updated_translation(
                    language,
                    and_then(
                        lambda s: s.rstrip(":"),
                        xpath_gettext_by_id(
                            profiles_page, ".//Label", "labelExecutable"
                        ),
                    ),
                    "Executable file",
                    "Ausführbare Datei",
                ),
                "parameters": and_then(
                    lambda s: s.rstrip(":"),
                    xpath_gettext_by_id(
                        profiles_page,
                        ".//Label",
                        "labelParameters",
                    ),
                ),
                "launchUrl": and_then(
                    lambda s: s.rstrip(":"),
                    xpath_gettext_by_id(
                        profiles_page,
                        ".//Label",
                        "labelLaunchURL",
                    ),
                ),
            },
        }
    }


def map_errors(root, language):
    return {
        "errors": {
            "routeNotFound": new_translation(
                language,
                "The route <code>{{route}}</code> doesn't exist.",
                "Die Route <code>{{route}}</code> existiert nicht.",
            ),
        }
    }


def merge_dicts(*dicts):
    """Recursively merges multiple dicts."""
    result = {}
    for d in dicts:
        for key, value in d.items():
            if (
                key in result
                and isinstance(result[key], dict)
                and isinstance(value, dict)
            ):
                result[key] = merge_dicts(result[key], value)
            else:
                result[key] = value
    return result


def del_none(d):
    """
    Delete keys with the value `None` in a dictionary, recursively.

    This alters the input so you may wish to `copy` the dict first.
    """
    for key, value in list(d.items()):
        if value is None:
            del d[key]
        elif isinstance(value, dict):
            del_none(value)
    return d  # For convenience


def parse_xml_custom(xml_path, language):
    tree = etree.parse(xml_path)
    root = tree.getroot()

    json_data = merge_dicts(
        map_common(root, language),
        map_errors(root, language),
        map_navigation(root, language),
        map_home(root, language),
        map_tweaks(root, language),
        map_pipboy(root, language),
        map_mods(root, language),
        map_gallery(root, language),
        map_settings(root, language),
        map_profiles(root, language),
        map_welcome(root, language),
    )

    json_data = del_none(json_data)

    return json_data


def save_to_json(data, json_path):
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def get_path_to_languages_folder():
    username = os.getenv("USER")
    if username is None:
        raise ValueError("USER env var not set")
    if os.name == "nt":
        return Path(os.getenv("LOCALAPPDATA")) / "Fallout 76 Quick Configuration" / "languages"
    return (
        Path("/media/")
        / username
        / "Windows"
        / "Users"
        / username.capitalize()
        / "AppData"
        / "Local"
        / "Fallout 76 Quick Configuration"
        / "languages"
    )

def get_languages(path):
    # languages = [
    #     f
    #     for f in os.listdir(path)
    #     if os.path.isdir(path / f) and not f.startswith(".") and len(f) == 5
    # ]
    languages = ["en-US", "de-DE"]
    return languages
    

if __name__ == "__main__":
    path = get_path_to_languages_folder()
    languages = get_languages(path)
    print("Found: %s" % ", ".join(languages))
    for language in languages:
        xml_file = path / language / ("%s.xml" % language)
        json_file = Path("./src/i18n") / ("%s.json" % language.split("-")[0])
        structured_data = parse_xml_custom(xml_file, language)
        save_to_json(structured_data, json_file)
        print(f"✅ Converted XML to JSON and saved to {json_file}")
