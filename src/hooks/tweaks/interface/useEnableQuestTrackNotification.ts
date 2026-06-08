import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useEnableQuestTrackNotification() {
  const defaultValue = true;

  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "MAIN",
        "bEnableQuestTrackNotification",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean(
        "Prefs",
        "MAIN",
        "bEnableQuestTrackNotification",
        value,
      );
      await ini.setBooleanIfPresent(
        "Custom",
        "MAIN",
        "bEnableQuestTrackNotification",
        value,
      );
    },
    defaultValue,
  );
}
