import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useSkipStartupSplash() {
  const defaultValue = false;
  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "General",
        "bSkipSplash",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean("Custom", "General", "bSkipSplash", value);
      await ini.setBoolean("Custom", "General", "bForceSplash", !value);
    },
    defaultValue,
  );
}
