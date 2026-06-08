import { commands, Theme } from "@/commands/bindings";
import { commandErrorToString } from "@/commands/errors";
import AccordionRow from "@/components/common/AccordionRow";
import ButtonRow from "@/components/common/ButtonRow";
import ComboRow from "@/components/common/ComboRow";
import { PageErrorAlert } from "@/components/common/ErrorAlert";
import { FlexCol, FlexRow } from "@/components/common/Flex";
import InfoRow from "@/components/common/InfoRow";
import PageAlert from "@/components/common/PageAlert";
import PageContainer from "@/components/common/PageContainer";
import PageTitle from "@/components/common/PageTitle";
import PreferencesGroup from "@/components/common/PreferencesGroup";
import RadioRow from "@/components/common/RadioRow";
import RadioRowGroup from "@/components/common/RadioRowGroup";
import SwitchRow from "@/components/common/SwitchRow";
import { useLazyAsync } from "@/hooks/async";
import { useUpdateCheckState } from "@/hooks/updater";
import { useTranslationsStore } from "@/lib/i18n/store";
import { updaterService } from "@/services/updater";
import { useSettingsStore } from "@/stores/settings";
import { css } from "@emotion/react";
import {
  faArrowsRotate,
  faChevronRight,
  faDownload,
  faFileCirclePlus,
  faFileLines,
  faInfoCircle,
  faRefresh,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as dialog from "@tauri-apps/plugin-dialog";
import i18next from "i18next";
import { ListGroup, Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export default function SettingsView() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  /* Settings store */
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const useGameCursor = useSettingsStore((s) => s.useGameCursor);
  const setUseGameCursor = useSettingsStore((s) => s.setUseGameCursor);
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const fetchServerStatusOnStart = useSettingsStore(
    (s) => s.fetchServerStatusOnStart,
  );
  const setFetchServerStatusOnStart = useSettingsStore(
    (s) => s.setFetchServerStatusOnStart,
  );
  const checkForUpdatesOnStart = useSettingsStore(
    (s) => s.checkForUpdatesOnStart,
  );
  const setCheckForUpdatesOnStart = useSettingsStore(
    (s) => s.setCheckForUpdatesOnStart,
  );
  const quitOnGameLaunch = useSettingsStore((s) => s.quitOnGameLaunch);
  const setQuitOnGameLaunch = useSettingsStore((s) => s.setQuitOnGameLaunch);
  const migratedFromV1 = useSettingsStore((s) => s.migratedFromV1);
  const setMigrationDismissed = useSettingsStore(
    (s) => s.setMigrationDismissed,
  );

  /* Translations store and actions */
  const translations = useTranslationsStore((s) => s.translations);
  const translationsLoadState = {
    parseErrors: useTranslationsStore((s) => s.parseErrors),
    error: useTranslationsStore((s) => s.error),
    isPending: useTranslationsStore((s) => s.isPending),
  };
  const loadTranslations = useTranslationsStore((s) => s.loadTranslations);
  const storeCreateTranslationTemplate = useTranslationsStore(
    (s) => s.createTranslationTemplate,
  );

  const { run: downloadAndReloadTranslations, ...translationsDownloadState } =
    useLazyAsync({
      promiseFn: async () => {
        await commands.downloadTranslations();
        loadTranslations().catch(console.error);
      },
    });

  const translationsPending =
    translationsLoadState.isPending || translationsDownloadState.isPending;

  const createTranslationTemplate = () => {
    storeCreateTranslationTemplate(i18next.language)
      .then((filename) => {
        dialog
          .message(
            t("settings.localization.templateCreated", { file: filename }),
            {
              title: t("common.success"),
              kind: "info",
            },
          )
          .catch((error) =>
            console.error(`Couldn't show Tauri message dialog: ${error}`),
          );
      })
      .catch((reason) =>
        dialog
          .message(
            t("settings.localization.templateCreated", {
              reason: commandErrorToString(reason),
            }),
            {
              title: t("errors.anErrorOccurred"),
              kind: "error",
            },
          )
          .catch((error) =>
            console.error(`Couldn't show Tauri message dialog: ${error}`),
          ),
      );
  };

  /* Updater state */
  const {
    version: newVersion,
    isPending: updateCheckPending,
    error: updateCheckError,
  } = useUpdateCheckState();

  return (
    <PageContainer>
      <PageTitle>{t("settings.title")}</PageTitle>
      <div>
        {migratedFromV1 && !migratedFromV1.dismissed && (
          <PageAlert variant="secondary">
            <FontAwesomeIcon icon={faInfoCircle} />
            &nbsp;&nbsp;
            <span>
              {t("settings.migrationInfo", {
                ...migratedFromV1,
                date: new Date(migratedFromV1.date),
                formatParams: {
                  date: {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                  },
                },
              })}
              &nbsp;
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setMigrationDismissed(true);
                }}
              >
                {t("settings.dismissMigrationInfo")}
              </a>
            </span>
          </PageAlert>
        )}
        {translationsLoadState.error && (
          <PageErrorAlert reason={translationsLoadState.error} />
        )}
        {translationsDownloadState.error && (
          <PageErrorAlert reason={translationsDownloadState.error} />
        )}
        {translationsLoadState.parseErrors.length > 0 &&
          translationsLoadState.parseErrors.map((error) => (
            <PageAlert key={error.key} variant="danger">
              <FlexRow>
                <span>
                  <b>
                    {t("settings.localization.couldNotLoadTranslation", {
                      file: error.fileName,
                    })}
                  </b>
                  &nbsp;
                  {error.message}
                </span>
              </FlexRow>
            </PageAlert>
          ))}
        <PreferencesGroup title={t("settings.localization.title")}>
          {translationsPending && (
            <ListGroup.Item>
              <FlexRow center gap="1rem" css={css`padding: 10px 0;`}>
                <FlexCol noGrow noShrink>
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Pending...</span>
                  </Spinner>
                </FlexCol>
                <FlexCol>
                  {translationsDownloadState.isPending
                    ? t("settings.localization.downloadingTranslations")
                    : t("settings.localization.loadingTranslations")}
                </FlexCol>
              </FlexRow>
            </ListGroup.Item>
          )}
          {!translationsPending && translations && (
            <ComboRow
              title={t("settings.localization.language")}
              value={language || undefined}
              onChange={setLanguage}
            >
              {translations.map(({ key, name }) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </ComboRow>
          )}
          <AccordionRow
            collapsedLabel={t("common.showMore")}
            expandedLabel={t("common.showLess")}
          >
            <ButtonRow
              center
              onClick={() => downloadAndReloadTranslations()}
              disabled={translationsPending}
            >
              <FontAwesomeIcon icon={faDownload} />
              <span css={css`margin-left: 10px;`}>
                {t("settings.localization.downloadTranslationsButton")}
              </span>
            </ButtonRow>
            <ButtonRow
              center
              onClick={() => loadTranslations()}
              disabled={translationsPending}
            >
              <FontAwesomeIcon icon={faRefresh} />
              <span css={css`margin-left: 10px;`}>
                {t("settings.localization.reloadTranslationsButton")}
              </span>
            </ButtonRow>
            <ButtonRow
              center
              onClick={() => createTranslationTemplate()}
              disabled={translationsPending}
            >
              <FontAwesomeIcon icon={faFileCirclePlus} />
              <span css={css`margin-left: 10px;`}>
                {t("settings.localization.createTemplateButton")}
              </span>
            </ButtonRow>
          </AccordionRow>
        </PreferencesGroup>

        <PreferencesGroup title={t("settings.theme.title")}>
          <RadioRowGroup
            name="theme"
            value={theme}
            onChange={(id) => setTheme(id as Theme)}
          >
            <RadioRow title={t("settings.theme.light")} id="light" />
            <RadioRow title={t("settings.theme.dark")} id="dark" />
            <RadioRow
              title={t("settings.theme.system")}
              subtitle={t("common.autoDetect")}
              id="system"
            />
          </RadioRowGroup>
        </PreferencesGroup>

        <PreferencesGroup title={t("settings.appearance.title")}>
          <SwitchRow
            title={t("settings.appearance.useGameCursor")}
            checked={useGameCursor}
            onChange={setUseGameCursor}
          />
        </PreferencesGroup>

        <PreferencesGroup title={t("settings.behavior.title")}>
          <SwitchRow
            title={t("settings.behavior.quitOnGameLaunch")}
            subtitle={t("settings.behavior.quitOnGameLaunchSubtitle")}
            checked={quitOnGameLaunch}
            onChange={setQuitOnGameLaunch}
          />
          {/*
          <SwitchRow title="Backup *.ini files on start" />
          <SwitchRow
            title="Check for updates on start"
            subtitle="This includes translation updates"
          />
          */}
          <SwitchRow
            title={t("settings.behavior.fetchServerStatusOnStart")}
            subtitle={t("settings.behavior.fetchServerStatusOnStartSubtitle")}
            checked={fetchServerStatusOnStart}
            onChange={setFetchServerStatusOnStart}
          />
          <SwitchRow
            title={t("settings.behavior.checkForUpdates")}
            subtitle={t("settings.behavior.checkForUpdatesSubtitle")}
            checked={checkForUpdatesOnStart}
            onChange={setCheckForUpdatesOnStart}
          />
        </PreferencesGroup>

        <PreferencesGroup title={t("settings.updates.title")}>
          {updateCheckPending && (
            <InfoRow>
              <FlexRow
                center
                gap="1rem"
                css={css`padding-top: 3px; padding-bottom: 3px;`}
              >
                <FlexCol noGrow noShrink>
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Pending...</span>
                  </Spinner>
                </FlexCol>
                <FlexCol>{t("common.loading")}</FlexCol>
              </FlexRow>
            </InfoRow>
          )}
          {updateCheckError && (
            <InfoRow
              title={t("settings.updates.checkFailed")}
              icon={faTriangleExclamation}
            >
              {commandErrorToString(updateCheckError)}
            </InfoRow>
          )}
          {newVersion && (
            <InfoRow
              title={t("settings.updates.updateAvailable")}
              icon={faInfoCircle}
            >
              {newVersion}
            </InfoRow>
          )}
          {!newVersion && (
            <ButtonRow center onClick={() => updaterService.check()}>
              <FontAwesomeIcon icon={faArrowsRotate} />
              <span css={css`margin-left: 10px;`}>
                {t("settings.updates.checkButton")}
              </span>
            </ButtonRow>
          )}
          {newVersion && (
            <ButtonRow
              center
              onClick={() => updaterService.downloadAndInstall()}
            >
              <FontAwesomeIcon icon={faDownload} />
              <span css={css`margin-left: 10px;`}>
                {t("settings.updates.downloadAndInstall")}
              </span>
            </ButtonRow>
          )}
        </PreferencesGroup>

        <PreferencesGroup title={t("settings.debug.title")}>
          <ButtonRow
            center
            onClick={() => commands.openLogFile().catch(console.error)}
          >
            <FontAwesomeIcon icon={faFileLines} />
            <span css={css`margin-left: 10px;`}>
              {t("settings.debug.openLogButton")}
            </span>
          </ButtonRow>
        </PreferencesGroup>

        <PreferencesGroup
          title={t("settings.profiles.title")}
          subtitle={t("settings.profiles.subtitle")}
        >
          <ButtonRow
            onClick={() => navigate("/profiles")}
            iconRight={<FontAwesomeIcon icon={faChevronRight} />}
          >
            {t("settings.profiles.goToProfiles")}
          </ButtonRow>
        </PreferencesGroup>
      </div>
    </PageContainer>
  );
}

// Stub for React Router v6
export const Component: React.FC = SettingsView;
Component.displayName = "SettingsView";
