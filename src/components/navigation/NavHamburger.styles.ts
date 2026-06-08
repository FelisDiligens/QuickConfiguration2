import { css } from "@emotion/react";

const navHamburger = (collapsed: boolean) => css`
  opacity: 0.3;
  padding: 6px 7px;
  height: 34px;
  width: 34px;
  border-radius: 10px;
  transition:
    background-color ease 0.1s,
    opacity ease 0.15s;
  border: none;
  color: inherit !important;
  background-color: transparent;

  ${
    collapsed
      ? css`
          margin: 8px;
        `
      : /* expanded */
        css`
          position: fixed;
          top: 8px;
          left: 8px;
        `
  }

  &:hover {
    background-color: rgba(128, 128, 128, 0.25);
    cursor: pointer;
    opacity: 1;
  }

  &:active {
    background-color: rgba(128, 128, 128, 0.5) !important;
  }
`;

export default {
  navHamburger,
};
