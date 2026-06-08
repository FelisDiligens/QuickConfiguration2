import { AppTheme } from "@/components/MyThemeProvider";
import { css } from "@emotion/react";

const navBar = (collapsed: boolean) => (theme: AppTheme) => css`
  display: flex;
  flex-direction: column;
  width: 220px;
  height: 100vh;
  margin: 0;
  padding: 0;
  color: ${theme.nav.fontColor};
  background-color: ${theme.nav.backgroundColor};
  transition: width ease 0.25s;
  container-type: inline-size;

  ${
    collapsed &&
    css`
      width: 50px;
    `
  }
`;

export default {
  navBar,
};
