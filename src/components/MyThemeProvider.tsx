import { useSettingsStore } from "@/stores/settings";
import { Global, ThemeProvider, css } from "@emotion/react";
import { useEffect } from "react";
import useTheme from "../hooks/useTheme";

export interface AppTheme {
  titleFontFamily: string;
  fontColor: string;
  nav: {
    fontColor: string;
    backgroundColor: string;
    backgroundHoverColor: string;
    iconColor: string;
  };
  card: {
    maxWidth: string;
    backgroundColor: string;
    borderColor: string;
    shadowColor: string;
  };
  components: {
    slider: {
      trackLeftColor: string;
      trackRightColor: string;
      thumbColor: string;
      thumbHighlightColor: string;
    };
    toolbar: {
      buttonVariant: string;
      backgroundColor: string;
      separatorColor: string;
    };
  };
}

declare module "@emotion/react" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface Theme extends AppTheme {}
}

const themeCommon = {
  titleFontFamily: "Overseer",
  card: {
    maxWidth: "660px",
  },
};

const darkTheme: AppTheme = {
  ...themeCommon,
  fontColor: "white",
  nav: {
    fontColor: "#fefeca",
    backgroundColor: "black",
    backgroundHoverColor: "#444",
    iconColor: "#fefeca",
  },
  card: {
    ...themeCommon.card,
    backgroundColor: "#2F353B",
    borderColor: "#212529",
    shadowColor: "#16191C",
  },
  components: {
    slider: {
      trackLeftColor: "#FFFCC0",
      trackRightColor: "#484E55",
      thumbColor: "#FFFCC0",
      thumbHighlightColor: "#979572",
    },
    toolbar: {
      buttonVariant: "outline-light",
      backgroundColor: "#171a1d",
      separatorColor: "#808080",
    },
  },
};

const lightTheme: AppTheme = {
  ...themeCommon,
  fontColor: "black",
  nav: {
    fontColor: "#111",
    backgroundColor: "#f0f0f0",
    backgroundHoverColor: "#aaa",
    iconColor: "#444",
  },
  card: {
    ...themeCommon.card,
    backgroundColor: "#f2f2f2",
    borderColor: "#ddd",
    shadowColor: "#ccc",
  },
  components: {
    slider: {
      trackLeftColor: "#EBC04B",
      trackRightColor: "#DEE2E6",
      thumbColor: "#EBC04B",
      thumbHighlightColor: "#FFFCC0",
    },
    toolbar: {
      buttonVariant: "outline-dark",
      backgroundColor: "#e9ebee",
      separatorColor: "#b3b1b1",
    },
  },
};

const cursorStyle = css`
  *,
  *::after,
  *::before {
    cursor: url("data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIGhlaWdodD0iMjUuN3B4IiB3aWR0aD0iMjYuNTVweCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZyB0cmFuc2Zvcm09Im1hdHJpeCgxLjAsIDAuMCwgMC4wLCAxLjAsIDQuNCwgNC4yNSkiPgogICAgPHBhdGggZD0iTTE0LjQgMTMuOSBMMTAuOTUgMjEuNDUgLTQuNCAtNC4wNSAtNC4yNSAtNC4yNSAyMi4xNSAxMC41NSAxNC40IDEzLjkiIGZpbGw9IiMxODFjMWQiIGZpbGwtcnVsZT0iZXZlbm9kZCIgc3Ryb2tlPSJub25lIi8+CiAgICA8cGF0aCBkPSJNMTMuMzUgMTIuODUgTDEwLjUgMTkuMDUgLTIuMSAtMS45IC0xLjk1IC0yLjA1IDE5LjcgMTAuMSAxMy4zNSAxMi44NSIgZmlsbD0idXJsKCNncmFkaWVudDApIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIHN0cm9rZT0ibm9uZSIvPgogICAgPHBhdGggZD0iTTEzLjM1IDEyLjg1IEwxMC41IDE5LjA1IC0yLjEgLTEuOSAtMS45NSAtMi4wNSAxOS43IDEwLjEgMTMuMzUgMTIuODUgTTEyLjk1IDEyLjM1IEwxOC42NSAxMC4wNSAtMC45NSAtMS4xNSAtMS4wNSAtMS4wNSAxMC40NSAxNy45NSAxMi45NSAxMi4zNSIgZmlsbD0iI2Y1Y2I1YiIgZmlsbC1ydWxlPSJldmVub2RkIiBzdHJva2U9Im5vbmUiLz4KICA8L2c+CiAgPGRlZnM+CiAgICA8cmFkaWFsR3JhZGllbnQgY3g9IjAiIGN5PSIwIiBncmFkaWVudFRyYW5zZm9ybT0ibWF0cml4KDAuMDExOSwgLTAuMDExNSwgMC4wMTE5LCAwLjAxMTUsIDYuNTUsIDYuMjUpIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgaWQ9ImdyYWRpZW50MCIgcj0iODE5LjIiIHNwcmVhZE1ldGhvZD0icGFkIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwLjAiIHN0b3AtY29sb3I9IiNmZmZmY2IiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIwLjkxNzY0NzA1ODgyMzUyOTQiIHN0b3AtY29sb3I9IiNmNWNiNWIiLz4KICAgIDwvcmFkaWFsR3JhZGllbnQ+CiAgPC9kZWZzPgo8L3N2Zz4K"),
      auto !important;
  }
`;

export default function MyThemeProvider(props: { children: React.ReactNode }) {
  const theme = useTheme();
  const useGameCursor = useSettingsStore((s) => s.useGameCursor);

  useEffect(() => {
    // https://getbootstrap.com/docs/5.3/customize/color-modes/
    document.body.setAttribute("data-bs-theme", theme);
  }, [theme]);

  return (
    <ThemeProvider theme={theme == "dark" ? darkTheme : lightTheme}>
      {useGameCursor && <Global styles={cursorStyle}></Global>}
      {props.children}
    </ThemeProvider>
  );
}
