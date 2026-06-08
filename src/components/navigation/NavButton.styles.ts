import { AppTheme } from "@/components/MyThemeProvider";
import { css } from "@emotion/react";

const navButton =
  (active: boolean, collapsed: boolean) => (theme: AppTheme) => css`
    height: 38px;
    display: flex;
    align-items: center;
    margin: 2px 0;
    padding: 6px 4px;
    /*background: linear-gradient(to right, ${
      theme.nav.backgroundHoverColor
    } 33%, ${theme.nav.backgroundColor} 66%);*/
    background-image: url(./img/button-bg-alt-440.png);
    background-size: 200% 100%;
    background-position: right bottom;
    transition: background-position 0.15s ease-out;
    color: ${theme.nav.fontColor};
    text-transform: uppercase;
    font-size: 12pt;
    font-family: "Roboto Condensed";
    font-weight: bold;
    border: 1px solid ${theme.nav.backgroundColor};
    user-select: none;
    box-sizing: border-box;

    &:hover {
      cursor: pointer;
      background-position: left bottom;
      color: black;
    }

    &:hover > svg {
      color: black;
    }

    & > img,
    & > svg {
      margin: 0px 8px;
      width: 24px;
      height: 24px;
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
      color: ${theme.nav.iconColor};
      transition: margin 0.25s ease;
    }

    & > span {
      padding-top: 2px;
      margin: 0px 4px;
      opacity: 1;
      transition: opacity ease 0.2s;
    }

    @container (max-width: 200px) {
      & > span {
        opacity: 0;
      }
    }

    ${
      active &&
      css`
        background-size: 200% 100%;
        background-position: left bottom;
        color: black;

        & > svg {
          color: black;
        }
      `
    }

    ${
      collapsed &&
      css`
        background: ${theme.nav.backgroundColor};
        background-position: right bottom;
        transition: none;

        &:hover {
          background: #fefa8b;
        }

        & > span {
          display: none;
        }

        & > img,
        & > svg {
          margin: 0px 8px;
        }
      `
    }

    ${
      active &&
      collapsed &&
      css`
        background-color: #fefa8b; /*#B3951E80;*/

        /*&:hover {
          background-color: #B3951EAA;
        }*/
      `
    }
  `;

export default {
  navButton,
};
