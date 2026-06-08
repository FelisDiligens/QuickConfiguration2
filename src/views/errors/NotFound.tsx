import { css } from "@emotion/react";
import { Trans, useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

export default function NotFound() {
  const { t } = useTranslation();
  const location = useLocation();
  return (
    <div css={css`text-align: center; padding-top: 100px; font-size: 16pt;`}>
      <span css={css`font-weight: bold;`}>{t("common.error")}</span>
      <br />
      <Trans
        t={t}
        i18nKey="errors.routeNotFound"
        values={{ route: location.pathname }}
        components={{ code: <code /> }}
      />
    </div>
  );
}

// Stub for React Router v6
export const Component: React.FC = NotFound;
Component.displayName = "NotFound";
