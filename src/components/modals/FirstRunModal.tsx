import { Steam24Icon, Xbox24Icon } from "@/assets/img";
import { GameEdition, Profile, commands } from "@/commands/bindings";
import CodeSpan from "@/components/common/CodeSpan";
import PathEntryRow from "@/components/common/PathEntryRow";
import PreferencesGroup from "@/components/common/PreferencesGroup";
import RadioRow from "@/components/common/RadioRow";
import RadioRowGroup from "@/components/common/RadioRowGroup";
import { AppTheme } from "@/components/MyThemeProvider";
import { useAsync } from "@/hooks/async";
import * as profilesService from "@/services/profiles";
import { useProfilesStore } from "@/stores/profiles";
import { useSettingsStore } from "@/stores/settings";
import { css } from "@emotion/react";
import {
  faMagnifyingGlass,
  faQuoteLeft,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { FlexCol, FlexRow } from "../common/Flex";
import LoadingAlert from "../common/LoadingAlert";
import SelectDetectedGamePathModal from "./SelectDetectedGamePathModal";

function VaultTecRepQuote() {
  const { t } = useTranslation();
  return (
    <div
      css={css`
        margin-top: 10px;
        opacity: 0.7;
        font-style: italic;
      `}
    >
      <FlexRow gap="0.5rem">
        <FlexCol
          noShrink
          css={css`
            width: 8px;
            background-color: teal;
            border-radius: 3px;
          `}
        ></FlexCol>
        <FlexCol
          shrink
          css={css`
            padding-right: 4px;
          `}
        >
          <FontAwesomeIcon
            icon={faQuoteLeft}
            css={css`
              width: 32px;
              height: 32px;
              color: teal;
            `}
          />
        </FlexCol>
        <FlexCol grow>
          <p>{t("welcome.quote.text")}</p>
          <p>{t("welcome.quote.rep")}</p>
        </FlexCol>
      </FlexRow>
    </div>
  );
}

export default function FirstRunModal() {
  const { t } = useTranslation();

  const profiles = useProfilesStore((store) => store.profiles);
  const setProfiles = useProfilesStore((store) => store.setProfiles);
  const setSelectedIndex = useProfilesStore((store) => store.setSelectedIndex);

  const isFirstRun = profiles.length == 0;
  const { data: isPrerelease } = useAsync(commands.isPrerelease);
  const isPrereleaseDismissed = useSettingsStore((s) => s.prereleaseDismissed);

  // Show the first run modal if no profiles are available and the prerelease modal isn't shown:
  const show = isFirstRun && !(isPrerelease && !isPrereleaseDismissed);

  const [loading, setLoading] = useState(false);
  const [showDetectGamePathModal, setShowDetectGamePathModal] = useState(false);
  const [profile, setProfile] = useState<Profile>(
    profilesService.createProfileWithDefaults(),
  );

  useEffect(() => {
    // Only show if no profiles available:
    if (isFirstRun) {
      // If the modal is shown, attempt to detect profile configuration:
      setLoading(true);
      profilesService
        .createProfileWithAutoDetectedDefaults()
        .then((profile) => {
          setProfile(profile);
          setLoading(false);
        })
        .catch((reason) => {
          console.error(
            `Error while detecting profile configuration: ${reason}`,
          );
          setLoading(false);
        });
    }
  }, [profiles]);

  function getStarted() {
    setProfiles([profile]);
    setSelectedIndex(0);
  }

  return (
    <>
      <Modal show={show && !showDetectGamePathModal} backdrop="static" centered>
        <Modal.Header>
          <Modal.Title>
            <h2
              css={css`
                font-weight: bold;
                margin: 5px 0 10px 0;
              `}
            >
              {t("welcome.title")}
            </h2>
            <span>{t("welcome.subtitle")}</span>
            <VaultTecRepQuote />
          </Modal.Title>
        </Modal.Header>
        {loading ? (
          <Modal.Body>
            <LoadingAlert>{t("common.loading")}</LoadingAlert>
          </Modal.Body>
        ) : (
          <>
            <Modal.Body
              css={css`
            padding-top: 0;
          `}
            >
              <PreferencesGroup
                title={t("profiles.gameEdition.title")}
                subtitle={t("profiles.gameEdition.subtitle")}
              >
                <RadioRowGroup
                  name="game-edition"
                  value={profile.gameEdition}
                  onChange={(value) => {
                    const edition = value as GameEdition;
                    setProfile((profile) => ({
                      ...profile,
                      ...profilesService.getProfileDefaultsForGameEdition(
                        edition,
                      ),
                    }));
                  }}
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
                  <RadioRow
                    id="Unknown"
                    title={t("profiles.gameEdition.other")}
                  />
                </RadioRowGroup>
              </PreferencesGroup>

              <PreferencesGroup
                title={t("profiles.gamePath.title")}
                subtitle={t("profiles.gamePath.subtitle")}
              >
                <PathEntryRow
                  title=""
                  value={profile.installationPath}
                  onChange={(path) => {
                    setProfile((profile) => ({
                      ...profile,
                      ...profilesService.getProfileDefaultsForGamePath(path),
                    }));
                  }}
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
                {t("profiles.gameEdition.steam")}:
                <ul>
                  <li>
                    <CodeSpan>
                      C:\Program Files (x86)\Steam\steamapps\common\Fallout76\
                    </CodeSpan>
                  </li>
                  <li>
                    <CodeSpan>
                      X:\SteamLibrary\steamapps\common\Fallout76\
                    </CodeSpan>
                  </li>
                </ul>
                {t("profiles.gameEdition.xbox")}:
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
            </Modal.Body>
            <Modal.Footer
              css={css`
            justify-content: center;
          `}
            >
              <Button
                variant="primary"
                css={css`
              min-width: 200px;
              border-radius: 9999px;
            `}
                onClick={getStarted}
              >
                {t("welcome.getStarted")}
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>
      <SelectDetectedGamePathModal
        show={showDetectGamePathModal}
        onAccept={(path) => {
          setProfile((profile) => ({
            ...profile,
            ...profilesService.getProfileDefaultsForGamePath(path),
          }));
          setShowDetectGamePathModal(false);
        }}
        onClose={() => setShowDetectGamePathModal(false)}
      />
    </>
  );
}
