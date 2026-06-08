import { AppTheme } from "@/components/MyThemeProvider";
import { css } from "@emotion/react";

const title = (theme: AppTheme) => css`
  & {
    padding: 5px 16px;
    user-select: none;
    min-height: 110px;
    opacity: 1;
    transition: opacity ease 0.2s;
  }

  @container (max-width: 180px) {
    & {
      visibility: hidden;
      opacity: 0;
    }
  }

  & > span {
    display: block;
    margin-top: -10px;
    color: ${theme.fontColor};
    font-size: 20pt;
    text-align: center;
    font-family: ${theme.titleFontFamily};
    white-space: nowrap;
  }
`;

export default {
  title,
};
