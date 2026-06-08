import { AnyError, commandErrorToString } from "@/commands/errors";
import { css } from "@emotion/react";
import { Alert } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { AppTheme } from "../MyThemeProvider";
import { FlexRow } from "./Flex";

interface Props {
  reason: AnyError;
  className?: string;
}

export function ErrorAlert(props: Props) {
  const { t } = useTranslation();
  return (
    <Alert variant="danger" className={props.className}>
      <FlexRow>
        <b>{t("errors.anErrorOccurred")}</b>:&nbsp;
        <span>{commandErrorToString(props.reason)}</span>
      </FlexRow>
    </Alert>
  );
}

export function PageErrorAlert(props: Omit<Props, "css">) {
  return (
    <ErrorAlert
      css={(theme: AppTheme) => css`
        margin: 10px auto 30px auto;
        width: 100%;
        max-width: ${theme.card.maxWidth};
      `}
      {...props}
    />
  );
}
