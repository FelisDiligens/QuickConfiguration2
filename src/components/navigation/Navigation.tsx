import { Nexus24Icon, PipBoy24Icon } from "@/assets/img";
import { commands } from "@/commands/bindings";
import { commandErrorToString } from "@/commands/errors";
import NavSpacer from "@/components/common/Spacer";
import { useProfilesStore } from "@/stores/profiles";
import { useSettingsStore } from "@/stores/settings";
import { css } from "@emotion/react";
import {
  faCameraRetro,
  faCog,
  faFile,
  faFolder,
  faFolderOpen,
  faHome,
  faPlay,
  faPuzzlePiece,
  faWrench,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import * as dialog from "@tauri-apps/plugin-dialog";
import { Dropdown } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { pathJoinSync } from "../../utils";
import { NavActionButton, NavActionDropdownToggle } from "./NavActionButton";
import NavButton from "./NavButton";
import NavHamburger from "./NavHamburger";
import NavProfileButton from "./NavProfileButton";
import NavTitle from "./NavTitle";
import styles from "./Navigation.styles";

function useBrowsePaths() {
  const { t } = useTranslation();

  function showOpenFolderErrorMessage(reason: Error | string) {
    const formattedReason = commandErrorToString(reason);
    dialog
      .message(`${t("errors.anErrorOccurred")}: ${formattedReason}`, {
        title: t("common.error"),
        kind: "error",
      })
      .catch((reason) =>
        console.error(`Couldn't show Tauri message dialog: ${reason}`),
      );
  }

  function showGamePathUnsetErrorMessage() {
    dialog
      .message(t("errors.gamePathNotSet"), {
        title: t("common.error"),
        kind: "error",
      })
      .catch((reason) =>
        console.error(`Couldn't show Tauri message dialog: ${reason}`),
      );
  }

  function showIniPathUnsetErrorMessage() {
    dialog
      .message(t("errors.iniPathNotSet"), {
        title: t("common.error"),
        kind: "error",
      })
      .catch((reason) =>
        console.error(`Couldn't show Tauri message dialog: ${reason}`),
      );
  }

  return {
    openGameInstallationFolder: () => {
      const gamePath = useProfilesStore.getState().getGamePath();
      if (gamePath) {
        commands
          .openPathInFileExplorer(gamePath)
          .catch(showOpenFolderErrorMessage);
      } else {
        showGamePathUnsetErrorMessage();
      }
    },
    openGameConfigurationFolder: () => {
      const iniPath = useProfilesStore.getState().getIniPath();
      if (iniPath) {
        commands
          .openPathInFileExplorer(iniPath)
          .catch(showOpenFolderErrorMessage);
      } else {
        showIniPathUnsetErrorMessage();
      }
    },
    openAppInstallationFolder: () => {
      commands
        .openSpecialPath("AppInstallFolder")
        .catch(showOpenFolderErrorMessage);
    },
    openAppConfigurationFolder: () => {
      commands
        .openSpecialPath("AppConfigFolder")
        .catch(showOpenFolderErrorMessage);
    },
    openAppTranslationsFolder: () => {
      commands
        .openSpecialPath("AppTranslationsFolder")
        .catch(showOpenFolderErrorMessage);
    },
    openSteamScreenshotsFolder: () => {
      commands
        .openSpecialPath("SteamScreenshotFolder")
        .catch(showOpenFolderErrorMessage);
    },
    openGamePhotosFolder: () => {
      const iniPath = useProfilesStore.getState().getIniPath();
      if (iniPath) {
        commands
          .openPathInFileExplorer(pathJoinSync(iniPath, "Photos"))
          .catch(showOpenFolderErrorMessage);
      } else {
        showIniPathUnsetErrorMessage();
      }
    },
    editMainIniFile: () => {
      const mainIniPath = useProfilesStore.getState().getIniMainPath();
      if (mainIniPath) {
        commands
          .openPathInFileExplorer(mainIniPath)
          .catch(showOpenFolderErrorMessage);
      } else {
        showIniPathUnsetErrorMessage();
      }
    },
    editPrefsIniFile: () => {
      const prefsIniPath = useProfilesStore.getState().getIniPrefsPath();
      if (prefsIniPath) {
        commands
          .openPathInFileExplorer(prefsIniPath)
          .catch(showOpenFolderErrorMessage);
      } else {
        showIniPathUnsetErrorMessage();
      }
    },
    editCustomIniFile: () => {
      const customIniPath = useProfilesStore.getState().getIniCustomPath();
      if (customIniPath) {
        commands
          .openPathInFileExplorer(customIniPath)
          .catch(showOpenFolderErrorMessage);
      } else {
        showIniPathUnsetErrorMessage();
      }
    },
  };
}

export default function Navigation() {
  const { t } = useTranslation();

  const collapsed = useSettingsStore((store) => store.navigationCollapsed);
  const setCollapsed = useSettingsStore((s) => s.setNavigationCollapsed);
  const iniPrefix = useProfilesStore((store) => store.getIniPrefix());

  const {
    openGameInstallationFolder,
    openGameConfigurationFolder,
    openAppInstallationFolder,
    openAppConfigurationFolder,
    openAppTranslationsFolder,
    openSteamScreenshotsFolder,
    openGamePhotosFolder,
    editMainIniFile,
    editPrefsIniFile,
    editCustomIniFile,
  } = useBrowsePaths();

  const launchGame = () => {
    const quitOnLaunch = useSettingsStore.getState().quitOnGameLaunch;
    const profile = useProfilesStore.getState().getSelectedProfile();
    if (!profile) {
      dialog
        .message(t("errors.profileNotSet"), {
          title: t("common.error"),
          kind: "error",
        })
        .catch((error) =>
          console.error(`Couldn't show Tauri message dialog: ${error}`),
        );
      return;
    }
    commands.launchGame(profile).catch((error) => {
      dialog
        .message(
          t("errors.launchGameFailed", { error: commandErrorToString(error) }),
          {
            title: t("common.error"),
            kind: "error",
          },
        )
        .catch((error) =>
          console.error(`Couldn't show Tauri message dialog: ${error}`),
        );
    });
    if (quitOnLaunch) {
      console.log("Quit on launch is enabled... should close app in 1 sec");
      setTimeout(
        () => getCurrentWebviewWindow().close().catch(console.error),
        1000,
      );
    }
  };

  return (
    <div css={styles.navBar(collapsed)}>
      <NavHamburger onClick={() => setCollapsed(!collapsed)} />
      {!collapsed && <NavTitle />}
      <div
        css={css`
          display: flex;
          flex-direction: ${collapsed ? "column" : "row"};
          padding-bottom: ${collapsed ? "2px" : "0px"};
          padding-left: ${collapsed ? "0px" : "4px"};
          padding-right: ${collapsed ? "0px" : "4px"};
        `}
      >
        <NavActionButton onClick={launchGame}>
          <FontAwesomeIcon icon={faPlay} color="LimeGreen" />
          <span>{t("navigation.playButton")}</span>
        </NavActionButton>
        {/*<NavActionButton>
            <FontAwesomeIcon icon={faSave} color="Blue" />
            <span>Save</span>
          </NavActionButton>*/}
        <Dropdown
          css={css`
            display: flex;
            flex-grow: 1;
          `}
        >
          <NavActionDropdownToggle>
            <FontAwesomeIcon icon={faFolder} color="#ffa500" />
            <span>{t("navigation.browseButton")}</span>
          </NavActionDropdownToggle>

          <Dropdown.Menu>
            <Dropdown.Item onClick={openGameInstallationFolder}>
              <FontAwesomeIcon icon={faFolderOpen} color="#ffa500" />{" "}
              {t("navigation.browse.gameInstallationFolder")}
            </Dropdown.Item>
            <Dropdown.Item onClick={openGameConfigurationFolder}>
              <FontAwesomeIcon icon={faFolderOpen} color="#ffa500" />{" "}
              {t("navigation.browse.gameConfigurationFolder")}
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item onClick={openAppInstallationFolder}>
              <FontAwesomeIcon icon={faFolderOpen} color="#ffa500" />{" "}
              {t("navigation.browse.appInstallationFolder")}
            </Dropdown.Item>
            <Dropdown.Item onClick={openAppConfigurationFolder}>
              <FontAwesomeIcon icon={faFolderOpen} color="#ffa500" />{" "}
              {t("navigation.browse.appConfigurationFolder")}
            </Dropdown.Item>
            <Dropdown.Item onClick={openAppTranslationsFolder}>
              <FontAwesomeIcon icon={faFolderOpen} color="#ffa500" />{" "}
              {t("navigation.browse.appTranslationsFolder")}
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item onClick={openSteamScreenshotsFolder}>
              <FontAwesomeIcon icon={faFolderOpen} color="#ffa500" />{" "}
              {t("navigation.browse.steamScreenshotsFolder")}
            </Dropdown.Item>
            <Dropdown.Item onClick={openGamePhotosFolder}>
              <FontAwesomeIcon icon={faFolderOpen} color="#ffa500" />{" "}
              {t("navigation.browse.gamePhotosFolder")}
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item onClick={editMainIniFile}>
              <FontAwesomeIcon icon={faFile} /> &nbsp;
              {t("navigation.browse.editIniFile", {
                file: `${iniPrefix || "Fallout76"}.ini`,
              })}
            </Dropdown.Item>
            <Dropdown.Item onClick={editPrefsIniFile}>
              <FontAwesomeIcon icon={faFile} /> &nbsp;
              {t("navigation.browse.editIniFile", {
                file: `${iniPrefix || "Fallout76"}Prefs.ini`,
              })}
            </Dropdown.Item>
            <Dropdown.Item onClick={editCustomIniFile}>
              <FontAwesomeIcon icon={faFile} /> &nbsp;
              {t("navigation.browse.editIniFile", {
                file: `${iniPrefix || "Fallout76"}Custom.ini`,
              })}
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
      <NavSpacer />
      <NavButton to="/" aliases={["/main_window", "/home"]}>
        <FontAwesomeIcon icon={faHome} />
        <span>{t("navigation.homePage")}</span>
      </NavButton>
      <NavButton to="/tweaks">
        <FontAwesomeIcon icon={faWrench} />
        <span>{t("navigation.tweaksPage")}</span>
      </NavButton>
      <NavButton to="/pipboy">
        <img src={PipBoy24Icon} />
        <span>{t("navigation.pipboyPage")}</span>
      </NavButton>
      <NavButton to="/mods">
        <FontAwesomeIcon icon={faPuzzlePiece} />
        <span>{t("navigation.modsPage")}</span>
      </NavButton>
      <NavButton to="/gallery">
        <FontAwesomeIcon icon={faCameraRetro} />
        <span>{t("navigation.galleryPage")}</span>
      </NavButton>
      {/*
        <NavButton to="/editor">
          <FontAwesomeIcon icon={faCode} />
          <span>Editor</span>
        </NavButton>
        */}
      <NavSpacer />
      <NavButton to="/settings">
        <FontAwesomeIcon icon={faCog} />
        <span>{t("navigation.settingsPage")}</span>
      </NavButton>
      <NavButton to="/nexusmods">
        <img src={Nexus24Icon} />
        <span>{t("navigation.nexusmodsPage")}</span>
      </NavButton>
      <NavSpacer />
      <div
        css={css`
          flex-grow: 1;
        `}
      ></div>
      <NavProfileButton collapsed={collapsed} />
    </div>
  );
}
