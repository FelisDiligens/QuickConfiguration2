import { AppTheme } from "@/components/MyThemeProvider";
import { css } from "@emotion/react";

const navActionButton = (collapsed: boolean) => (theme: AppTheme) => css`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin: 1px 0px 0px 0px;
  padding: 4px 4px;
  font-size: 11pt;
  border-radius: 4px;
  transition: background-color 0.1s ease;
  user-select: none;
  flex-grow: 1;
  color: ${theme.nav.fontColor};
  border: none;
  background-color: transparent;

  & > span {
    margin-left: 8px;
  }

  & > img,
  & > svg {
    display: block;
    width: auto;
    height: 20px;
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
  }

  &:hover {
    background-color: ${theme.nav.backgroundHoverColor};
    color: ${theme.nav.fontColor} !important;
    cursor: pointer;
  }

  &:active,
  &:focus {
    color: ${theme.nav.fontColor} !important;
  }

  ${
    collapsed &&
    css`
      flex-direction: column;
      width: 100%;
      margin: 4px 6px;
      padding: 8px 0px;
      max-width: 38px;

      & > span {
        display: none;
      }
    `
  }

  @container (max-width: 200px) {
    & > span {
      opacity: 0;
    }
  }
`;

const navActionDropDown = (collapsed: boolean) => (theme: AppTheme) => css`
  ${navActionButton(collapsed)(theme)}

  background: inherit;
  border: none;

  &.btn:active {
    background-color: ${theme.nav.backgroundHoverColor};
  }

  &.show {
    background-color: ${theme.nav.backgroundHoverColor};
  }

  &.dropdown-toggle {
    min-width: 38px;
  }

  &.dropdown-toggle::after {
    display: none;
  }
`;

export default {
  navActionButton,
  navActionDropDown,
};
