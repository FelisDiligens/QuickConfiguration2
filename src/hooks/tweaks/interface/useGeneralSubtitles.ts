import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useGeneralSubtitles() {
  const defaultValue = false;
  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "Interface",
        "bGeneralSubtitles",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean("Prefs", "Interface", "bGeneralSubtitles", value);
      await ini.setBooleanIfPresent(
        "Custom",
        "Interface",
        "bGeneralSubtitles",
        value,
      );
    },
    defaultValue,
  );
}
