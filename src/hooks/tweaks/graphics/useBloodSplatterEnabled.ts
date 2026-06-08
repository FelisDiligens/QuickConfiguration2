import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useBloodSplatterEnabled() {
  const defaultValue = true;

  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "ScreenSplatter",
        "bBloodSplatterEnabled",
        defaultValue,
      ),
    async (value) => {
      if (value) {
        // Remove entry when set to it's default value
        await ini.delete("Custom", "ScreenSplatter", "bBloodSplatterEnabled");
      } else {
        await ini.setBoolean(
          "Custom",
          "ScreenSplatter",
          "bBloodSplatterEnabled",
          false,
        );
      }
    },
    defaultValue,
  );
}
