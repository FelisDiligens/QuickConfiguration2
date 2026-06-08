import { css } from "@emotion/react";
import React from "react";
import { Alert, Spinner } from "react-bootstrap";
import { AppTheme } from "../MyThemeProvider";
import { FlexCol, FlexRow } from "./Flex";

interface Props {
  children: React.ReactNode;
  className?: string;
}

export default function LoadingAlert(props: Props) {
  return (
    <Alert variant="dark" className={props.className}>
      <FlexRow center gap="1rem">
        <FlexCol noGrow noShrink>
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Pending...</span>
          </Spinner>
        </FlexCol>
        <FlexCol>{props.children}</FlexCol>
      </FlexRow>
    </Alert>
  );
}

export function PageLoadingAlert(props: Omit<Props, "css">) {
  return (
    <LoadingAlert
      css={(theme: AppTheme) => css`
        margin: 10px auto 30px auto;
        width: 100%;
        max-width: ${theme.card.maxWidth};
      `}
      {...props}
    />
  );
}
