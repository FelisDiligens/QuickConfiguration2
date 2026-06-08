import { commands } from "@/commands/bindings";
import { isAnyError } from "@/commands/errors";
import ButtonRow from "@/components/common/ButtonRow";
import { PageErrorAlert } from "@/components/common/ErrorAlert";
import PageContainer from "@/components/common/PageContainer";
import PageTitle from "@/components/common/PageTitle";
import PreferencesGroup from "@/components/common/PreferencesGroup";
import { AppTheme } from "@/components/MyThemeProvider";
import { css } from "@emotion/react";
import { faFileLines, faRefresh } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FallbackProps } from "react-error-boundary";
import { useTranslation } from "react-i18next";

export default function Fallback({ error, resetErrorBoundary }: FallbackProps) {
  const { t } = useTranslation();
  return (
    <PageContainer>
      <PageTitle>{t("errorBoundary.titleOops")}</PageTitle>
      <h2
        css={(theme: AppTheme) => css`
          font-size: 1.25rem;
          max-width: ${theme.card.maxWidth};
          width: 100%;
          margin: 5px auto 20px auto;
        `}
      >
        {t("errors.anUnexpectedErrorOccurred")}
      </h2>
      <PageErrorAlert reason={isAnyError(error) ? error : String(error)} />
      <PreferencesGroup>
        <ButtonRow center onClick={resetErrorBoundary}>
          <FontAwesomeIcon icon={faRefresh} />
          <span css={css`margin-left: 10px;`}>
            {t("errorBoundary.tryAgainButton")}
          </span>
        </ButtonRow>
        <ButtonRow
          center
          onClick={() => commands.openLogFile().catch(console.error)}
        >
          <FontAwesomeIcon icon={faFileLines} />
          <span css={css`margin-left: 10px;`}>
            {t("errorBoundary.openLogButton")}
          </span>
        </ButtonRow>
      </PreferencesGroup>
    </PageContainer>
  );
}
