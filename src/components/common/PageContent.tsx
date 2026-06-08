import { css, SerializedStyles } from "@emotion/react";
import React from "react";
import { AppTheme } from "../MyThemeProvider";

interface Props {
  children: React.ReactNode;
  css?: SerializedStyles;
  className?: string;
}

export default function PageContent(props: Props) {
  return (
    <div
      css={(theme: AppTheme) => css`
        max-width: ${theme.card.maxWidth};
        margin: 10px auto 0 auto;
        width: 100%;
      `}
      className={props.className}
    >
      {props.children}
    </div>
  );
}
