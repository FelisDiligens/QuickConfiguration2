import { css } from "@emotion/react";
import { AppTheme } from "../MyThemeProvider";

interface Props {
  children: React.ReactNode;
}

export function Title(props: Props) {
  return (
    <h1
      css={css`
        font-size: 26pt;
        font-family: "Overseer", "Roboto";
        margin-left: 28px;
      `}
      className="title"
    >
      {props.children}
    </h1>
  );
}

export default function PageTitle(props: Props) {
  return (
    <h1
      css={(theme: AppTheme) => css`
        max-width: ${theme.card.maxWidth};
        font-size: 26pt;
        font-family: "Overseer", "Roboto";
        margin: 10px auto 0 auto;
        width: 100%;
      `}
      className="title"
    >
      {props.children}
    </h1>
  );
}
