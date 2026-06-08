import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useShowFloatingQuestMarkers() {
  const defaultValue = true;
  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "GamePlay",
        "bShowFloatingQuestMarkers",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean(
        "Prefs",
        "GamePlay",
        "bShowFloatingQuestMarkers",
        value,
      );
      await ini.setBooleanIfPresent(
        "Custom",
        "GamePlay",
        "bShowFloatingQuestMarkers",
        value,
      );
    },
    defaultValue,
  );
}
