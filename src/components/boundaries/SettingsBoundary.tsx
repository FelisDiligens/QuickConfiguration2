import { settingsStoreSync } from "@/stores/settings";
import { useSyncLoadState } from "@/utils/zustand";
import LoadingScreen from "@/views/loading/LoadingScreen";
import { css } from "@emotion/react";
import { Button } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { PageErrorAlert } from "../common/ErrorAlert";
import PageAlert from "../common/PageAlert";
import PageContainer from "../common/PageContainer";
import PageTitle from "../common/PageTitle";
import { AppTheme } from "../MyThemeProvider";

interface Props {
  children?: React.ReactNode;
}

export function SettingsBoundary(props: Props) {
  const { t } = useTranslation();
  const { hasLoaded, isPending, error } = useSyncLoadState(settingsStoreSync);
  if (error) {
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
        <div>
          <PageAlert>{t("errors.settingsLoadFailed")}</PageAlert>
          <PageErrorAlert reason={error} />
        </div>
        <Button
          css={(theme: AppTheme) => css`
            max-width: ${theme.card.maxWidth};
            width: 100%;
            margin: 5px auto 20px auto;
          `}
          onClick={() => window.location.reload()}
        >
          {t("errorBoundary.tryAgainButton")}
        </Button>
      </PageContainer>
    );
  } else if (!hasLoaded || isPending) {
    return <LoadingScreen />;
  } else {
    return <>{props.children}</>;
  }
}
