import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useAimAssist() {
  const defaultValue = true;
  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "MAIN",
        "bUserAimAssistModelEnabled",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean(
        "Prefs",
        "MAIN",
        "bUserAimAssistModelEnabled",
        value,
      );
      await ini.setBooleanIfPresent(
        "Custom",
        "MAIN",
        "bUserAimAssistModelEnabled",
        value,
      );
    },
    defaultValue,
  );
}
