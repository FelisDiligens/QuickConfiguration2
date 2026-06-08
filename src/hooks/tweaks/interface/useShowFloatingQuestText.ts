import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useShowFloatingQuestText() {
  const defaultValue = true;
  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "GamePlay",
        "bShowFloatingQuestText",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean(
        "Prefs",
        "GamePlay",
        "bShowFloatingQuestText",
        value,
      );
      await ini.setBooleanIfPresent(
        "Custom",
        "GamePlay",
        "bShowFloatingQuestText",
        value,
      );
    },
    defaultValue,
  );
}
