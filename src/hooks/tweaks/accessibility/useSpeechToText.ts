import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useSpeechToText() {
  const defaultValue = false;

  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "Accessibility",
        "bUserPrefSpeechToText",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean(
        "Prefs",
        "Accessibility",
        "bUserPrefSpeechToText",
        value,
      );
      await ini.setBooleanIfPresent(
        "Custom",
        "Accessibility",
        "bUserPrefSpeechToText",
        value,
      );
    },
    defaultValue,
  );
}
