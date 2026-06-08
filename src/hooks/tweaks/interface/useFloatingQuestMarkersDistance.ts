import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useFloatingQuestMarkersDistance() {
  const defaultValue = 100.0;
  return useTweak<number>(
    () =>
      ini.findFloatWithDefault(
        ["Custom", "Prefs"],
        "GamePlay",
        "fFloatingQuestMarkersDistance",
        defaultValue,
      ),
    async (value) => {
      await ini.setFloat(
        "Prefs",
        "GamePlay",
        "fFloatingQuestMarkersDistance",
        value,
      );
      await ini.setFloatIfPresent(
        "Custom",
        "GamePlay",
        "fFloatingQuestMarkersDistance",
        value,
      );
    },
    defaultValue,
  );
}
