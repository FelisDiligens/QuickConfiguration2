import { commands, IniErrorContext } from "@/commands/bindings";
import {
  AnyError,
  commandErrorIsType,
  commandErrorToString,
} from "@/commands/errors";
import CodeError from "@/components/common/CodeError";
import { PageErrorAlert } from "@/components/common/ErrorAlert";
import PageContainer from "@/components/common/PageContainer";
import PageContent from "@/components/common/PageContent";
import PageTitle from "@/components/common/PageTitle";
import { useProfilesStore } from "@/stores/profiles";
import { faFileCirclePlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as dialog from "@tauri-apps/plugin-dialog";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import ButtonRow from "./ButtonRow";
import PreferencesGroup from "./PreferencesGroup";

interface Props {
  pageTitle: string;
  error: AnyError;
  context: IniErrorContext | null;
  reloadIni: () => void;
}

export default function PageIniErrorDetails({
  pageTitle,
  error,
  context,
  reloadIni,
}: Props) {
  const { t } = useTranslation();

  const createIniFiles = async () => {
    try {
      const iniPath = useProfilesStore.getState().getIniPath();
      const iniPrefix = useProfilesStore.getState().getIniPrefix();
      if (!iniPath || !iniPrefix)
        throw new Error("mods.errors.unsetIniPathOrIniPrefix");

      await commands.iniCreateFiles(iniPath, iniPrefix);
      reloadIni();
    } catch (error) {
      dialog
        .message(
          `${t("errors.anErrorOccurred")}: ${commandErrorToString(error as AnyError)}`,
          {
            title: t("common.error"),
            kind: "error",
          },
        )
        .catch((error) =>
          console.error(`Couldn't show Tauri message dialog: ${error}`),
        );
    }
  };

  if (error == null) {
    return <></>;
  } else {
    return (
      <PageContainer>
        <PageTitle>{pageTitle}</PageTitle>
        <PageErrorAlert reason={error} />
        {commandErrorIsType(error, "IniParseError") ? (
          <PageContent>
            <h3>{t("errors.iniParseError.title")}</h3>
            {context && (
              <CodeError fileName={context.fileName} lines={context.lines} />
            )}
            <br />
            <Trans
              t={t}
              i18nKey="errors.iniParseError.text"
              components={{
                ul: <ul />,
                li: <li />,
                b: <b />,
                code: <code />,
              }}
              tOptions={{ joinArrays: "" }}
            />
          </PageContent>
        ) : (
          <PageContent>
            <h3>{t("errors.iniNotFound.title")}</h3>
            <Trans
              t={t}
              i18nKey="errors.iniNotFound.text"
              components={{
                ul: <ul />,
                li: <li />,
                b: <b />,
                code: <code />,
                a: <Link to="/profiles" />,
              }}
              tOptions={{ joinArrays: "" }}
            />
            <PreferencesGroup>
              <ButtonRow center onClick={createIniFiles}>
                <FontAwesomeIcon icon={faFileCirclePlus} />
                &nbsp; {t("errors.iniNotFound.createIniButton")}
              </ButtonRow>
            </PreferencesGroup>
          </PageContent>
        )}
      </PageContainer>
    );
  }
}
