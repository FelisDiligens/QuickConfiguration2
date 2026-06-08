import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

/**
 * When you take screenshots ingame with the print screen button,
 * it saves them in the game directory as "ScreenShotX.png".
 * The "X" being the screenshot index.
 */
export default function useScreenshotIndex() {
  const defaultValue = 0;
  return useTweak<number>(
    () =>
      ini.findIntWithDefault(
        ["Custom", "Prefs"],
        "Display",
        "iScreenShotIndex",
        defaultValue,
      ),
    async (value) => {
      await ini.setInt("Prefs", "Display", "iScreenShotIndex", value);
      await ini.setIntIfPresent("Custom", "Display", "iScreenShotIndex", value);
    },
    defaultValue,
  );
}
