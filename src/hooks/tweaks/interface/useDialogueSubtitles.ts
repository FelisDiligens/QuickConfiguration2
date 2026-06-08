import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useDialogueSubtitles() {
  const defaultValue = true;
  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "Interface",
        "bDialogueSubtitles",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean("Prefs", "Interface", "bDialogueSubtitles", value);
      await ini.setBooleanIfPresent(
        "Custom",
        "Interface",
        "bDialogueSubtitles",
        value,
      );
    },
    defaultValue,
  );
}
