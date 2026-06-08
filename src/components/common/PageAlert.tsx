import { css } from "@emotion/react";
import { Alert, AlertProps } from "react-bootstrap";
import { AppTheme } from "../MyThemeProvider";

export default function PageAlert(props: AlertProps) {
  return (
    <Alert
      css={(theme: AppTheme) => css`
        margin: 10px auto 30px auto;
        width: 100%;
        max-width: ${theme.card.maxWidth};
      `}
      {...props}
    />
  );
}
