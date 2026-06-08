import { Steam24Icon, Xbox24Icon } from "@/assets/img";
import {
  GameEdition,
  LaunchOption,
  Profile,
  commands,
} from "@/commands/bindings";
import CodeSpan from "@/components/common/CodeSpan";
import Entry from "@/components/common/Entry";
import EntryRow from "@/components/common/EntryRow";
import PathEntryRow from "@/components/common/PathEntryRow";
import PreferencesGroup, {
  PreferencesCard,
} from "@/components/common/PreferencesGroup";
import RadioRow from "@/components/common/RadioRow";
import RadioRowGroup from "@/components/common/RadioRowGroup";
import SelectDetectedGamePathModal from "@/components/modals/SelectDetectedGamePathModal";
import { AppTheme } from "@/components/MyThemeProvider";
import * as profilesService from "@/services/profiles";
import { useProfilesStore } from "@/stores/profiles";
import { css } from "@emotion/react";
import {
  faMagnifyingGlass,
  faRefresh,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { Accordion, Button, Modal } from "react-bootstrap";
import { useTranslation } from "react-i18next";

interface Props {
  profile: Profile;
  show: boolean;
  onHide: () => void;
  onSave: (profile: Profile) => void;
}

export default function EditProfileModal(props: Props) {
  const { t } = useTranslation();

  const [title, setTitle] = useState(props.profile.title);
  const [gameEdition, setGameEdition] = useState(props.profile.gameEdition);
  const [gamePath, setGamePath] = useState(props.profile.installationPath);
  const [modsPath, setModsPath] = useState(props.profile.modsPath);
  const [iniPrefix, setIniPrefix] = useState(props.profile.iniPrefix);
  const [iniPath, setIniPath] = useState(props.profile.iniPath);
  const [launchOption, setLaunchOption] = useState(props.profile.launchOption);
  const [executableName, setExecutableName] = useState(
    props.profile.executableName,
  );
  const [execParameters, setExecParameters] = useState(
    props.profile.execParameters,
  );
  const [launcherURL, setLauncherURL] = useState(props.profile.launcherURL);

  const [showDetectGamePathModal, setShowDetectGamePathModal] = useState(false);

  function onChangeGameEdition(value: GameEdition) {
    const newGameEdition = value;
    setGameEdition(newGameEdition);

    if (newGameEdition !== "Unknown") {
      const defaultsForGameEdition =
        profilesService.getProfileDefaultsForGameEdition(newGameEdition);
      setIniPrefix(defaultsForGameEdition.iniPrefix);
      setExecutableName(defaultsForGameEdition.executableName);
      setExecParameters(
        (oldValue) => oldValue || defaultsForGameEdition.execParameters,
      );
      setLauncherURL(defaultsForGameEdition.launcherURL);
      setLaunchOption(defaultsForGameEdition.launchOption);
    }
  }

  function onChangeGamePath(path: string) {
    const oldGamePath = gamePath;
    setGamePath(path);

    const defaultModsPath = useProfilesStore
      .getState()
      .getDefaultModsPath(path);
    setModsPath((oldModsPath) => {
      // If the previously set mod path was the default one, then overwrite it:
      if (
        oldModsPath ==
        useProfilesStore.getState().getDefaultModsPath(oldGamePath)
      )
        return defaultModsPath || "";

      // Otherwise only change it if the mod path is unset:
      // (assuming that if the mod path was not the default,
      //  then the user has set it to something else on purpose)
      return oldModsPath || defaultModsPath || "";
    });
  }

  function onSave() {
    const newProfile: Profile = {
      key: props.profile.key || crypto.randomUUID(),
      title,
      installationPath: gamePath,
      modsPath,
      executableName,
      execParameters,
      launcherURL,
      iniPrefix,
      iniPath,
      gameEdition,
      launchOption,
    };
    props.onSave(newProfile);
  }

  return (
    <>
      <Modal
        show={props.show && !showDetectGamePathModal}
        onHide={props.onHide}
        size="xl"
        backdrop="static"
        css={(theme: AppTheme) => css`
          & .modal-dialog {
            max-width: calc(${theme.card.maxWidth} + 40px);
          }
        `}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <h2
              css={css`
                font-weight: bold;
                margin: 0;
              `}
            >
              {t("profiles.editProfile")}
            </h2>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Entry
            label={t("profiles.profileName")}
            value={title}
            onChange={setTitle}
          />

          <PreferencesGroup
            title={t("profiles.gameEdition.title")}
            subtitle={t("profiles.gameEdition.subtitle")}
          >
            <RadioRowGroup
              name="game-edition"
              value={gameEdition}
              onChange={(value) => onChangeGameEdition(value as GameEdition)}
            >
              <RadioRow
                id="Steam"
                title={t("profiles.gameEdition.steam")}
                imageSrc={Steam24Icon}
              />
              <RadioRow
                id="SteamPTS"
                title={t("profiles.gameEdition.steamPTS")}
                imageSrc={Steam24Icon}
              />
              <RadioRow
                id="Xbox"
                title={t("profiles.gameEdition.xbox")}
                imageSrc={Xbox24Icon}
              />
              <RadioRow id="Unknown" title={t("profiles.gameEdition.other")} />
            </RadioRowGroup>
          </PreferencesGroup>

          <PreferencesGroup
            title={t("profiles.gamePath.title")}
            subtitle={t("profiles.gamePath.subtitle")}
          >
            <PathEntryRow
              title=""
              value={gamePath}
              onChange={onChangeGamePath}
              onValidate={(path) => commands.validateGamePath(path)}
              suffix={
                <Button
                  variant="outline-primary"
                  title={t("common.autoDetectPathButton")}
                  onClick={() => setShowDetectGamePathModal(true)}
                >
                  <FontAwesomeIcon icon={faMagnifyingGlass} />
                </Button>
              }
            />
          </PreferencesGroup>

          <details
            css={(theme: AppTheme) => css`
              max-width: ${theme.card.maxWidth};
              margin: 0 auto;
            `}
          >
            <summary>{t("profiles.gamePath.clickForTip")}</summary>
            <p>{t("profiles.gameEdition.steam")}:</p>
            <ul>
              <li>
                <CodeSpan>
                  C:\Program Files (x86)\Steam\steamapps\common\Fallout76\
                </CodeSpan>
              </li>
              <li>
                <CodeSpan>X:\SteamLibrary\steamapps\common\Fallout76\</CodeSpan>
              </li>
            </ul>
            <p>{t("profiles.gameEdition.xbox")}:</p>
            <ul>
              <li>
                <CodeSpan>
                  C:\Program Files\ModifiableWindowsApps\Fallout76\
                </CodeSpan>
              </li>
              <li>
                <CodeSpan>X:\XboxGames\Fallout76\Content\</CodeSpan>
              </li>
            </ul>
          </details>

          <Accordion
            css={(theme: AppTheme) => css`
              margin: 0 auto;
              margin-top: 20px;
              max-width: ${theme.card.maxWidth};
            `}
          >
            <Accordion.Item eventKey="0">
              <Accordion.Header
                css={css`
                  margin: 0;
                `}
              >
                {t("profiles.advancedOptions")}
              </Accordion.Header>
              <Accordion.Body
                css={css`
                  padding: 0 20px;
                `}
              >
                <PreferencesGroup
                  title={t("profiles.modsPath.title")}
                  subtitle={t("profiles.modsPath.subtitle")}
                >
                  <PathEntryRow
                    title=""
                    value={modsPath}
                    onChange={setModsPath}
                    onValidate={(path) => commands.isDirectory(path)}
                    suffix={
                      <Button
                        variant="outline-danger"
                        title={t("common.resetButton")}
                        onClick={() =>
                          setModsPath(
                            useProfilesStore
                              .getState()
                              .getDefaultModsPath(gamePath) || "",
                          )
                        }
                      >
                        <FontAwesomeIcon icon={faRefresh} />
                      </Button>
                    }
                  />
                </PreferencesGroup>

                <PreferencesGroup
                  title={t("profiles.configFiles.title")}
                  subtitle={t("profiles.configFiles.subtitle")}
                >
                  <EntryRow
                    floatingLabel={t("profiles.configFiles.iniPrefix")}
                    value={iniPrefix}
                    onChange={setIniPrefix}
                  />
                  <PathEntryRow
                    floatingLabel={t("profiles.configFiles.iniParentPath")}
                    value={iniPath}
                    onChange={setIniPath}
                    onValidate={(path) => commands.isDirectory(path)}
                    suffix={
                      <Button
                        variant="outline-danger"
                        title={t("common.resetButton")}
                        onClick={async () => {
                          const detectedIniPath =
                            await commands.detectIniPath(gamePath);
                          setIniPath(
                            (oldValue) => detectedIniPath || oldValue || "",
                          );
                        }}
                      >
                        <FontAwesomeIcon icon={faRefresh} />
                      </Button>
                    }
                  />
                </PreferencesGroup>

                <PreferencesGroup
                  title={t("profiles.launchOptions.title")}
                  subtitle={t("profiles.launchOptions.subtitle")}
                >
                  <RadioRowGroup
                    name="start-option"
                    value={launchOption}
                    onChange={(value) => setLaunchOption(value as LaunchOption)}
                  >
                    <RadioRow
                      title={t("profiles.launchOptions.launchWithLauncher")}
                      id="OpenURL"
                    />
                    <RadioRow
                      title={t("profiles.launchOptions.runExecutableDirectly")}
                      id="RunExec"
                    />
                  </RadioRowGroup>
                </PreferencesGroup>

                <PreferencesCard>
                  <Entry
                    label={t("profiles.launchOptions.executableFile")}
                    value={executableName}
                    onChange={setExecutableName}
                  />
                  <Entry
                    label={t("profiles.launchOptions.parameters")}
                    value={execParameters}
                    onChange={setExecParameters}
                  />
                  <Entry
                    label={t("profiles.launchOptions.launchUrl")}
                    value={launcherURL}
                    onChange={setLauncherURL}
                  />
                </PreferencesCard>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </Modal.Body>
        <Modal.Footer
          css={css`
            justify-content: center;
          `}
        >
          <Button
            variant="primary"
            onClick={onSave}
            css={css`
              min-width: 200px;
              padding: 10px;
              border-radius: 9999px;
            `}
          >
            {t("common.saveButton")}
          </Button>
          <Button
            variant="danger"
            onClick={props.onHide}
            css={css`
              min-width: 200px;
              padding: 10px;
              border-radius: 9999px;
            `}
          >
            {t("common.cancel")}
          </Button>
        </Modal.Footer>
      </Modal>
      <SelectDetectedGamePathModal
        show={showDetectGamePathModal}
        onAccept={(path) => {
          onChangeGamePath(path);
          setShowDetectGamePathModal(false);
        }}
        onClose={() => setShowDetectGamePathModal(false)}
      />
    </>
  );
}
