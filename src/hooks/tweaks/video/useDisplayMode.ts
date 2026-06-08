import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export type DisplayMode =
  | "fullscreen"
  | "windowed"
  | "borderlessWindowed"
  | "borderlessFullscreen";

export default function useDisplayMode() {
  return useTweak<DisplayMode>(
    async () => {
      const bFullScreen = await ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "Display",
        "bFull Screen",
        false,
      );
      const bBorderless = await ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "Display",
        "bBorderless",
        true,
      );
      const bMaximizeWindow = await ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "Display",
        "bMaximizeWindow",
        false,
      );

      if (bFullScreen) return "fullscreen";
      else if (!bBorderless) return "windowed";
      else if (bBorderless && !bMaximizeWindow) return "borderlessWindowed";
      else return "borderlessFullscreen";
    },
    async (value) => {
      let bFullScreen, bBorderless, bMaximizeWindow;
      switch (value) {
        case "fullscreen":
          bBorderless = true;
          bFullScreen = true;
          bMaximizeWindow = false;
          break;
        case "windowed":
          bBorderless = false;
          bFullScreen = false;
          bMaximizeWindow = false;
          break;
        case "borderlessFullscreen":
          bBorderless = true;
          bFullScreen = false;
          bMaximizeWindow = true;
          break;
        case "borderlessWindowed":
        default:
          bBorderless = true;
          bFullScreen = false;
          bMaximizeWindow = false;
          break;
      }
      await ini.setBoolean("Prefs", "Display", "bFull Screen", bFullScreen);
      await ini.setBooleanIfPresent(
        "Custom",
        "Display",
        "bFull Screen",
        bFullScreen,
      );
      await ini.setBoolean("Prefs", "Display", "bBorderless", bBorderless);
      await ini.setBooleanIfPresent(
        "Custom",
        "Display",
        "bBorderless",
        bBorderless,
      );
      await ini.setBoolean(
        "Prefs",
        "Display",
        "bMaximizeWindow",
        bMaximizeWindow,
      );
      await ini.setBooleanIfPresent(
        "Custom",
        "Display",
        "bMaximizeWindow",
        bMaximizeWindow,
      );
    },
    "borderlessWindowed",
  );
}
