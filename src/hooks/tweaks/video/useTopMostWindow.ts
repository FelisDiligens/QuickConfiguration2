import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useTopMostWindow() {
  const defaultValue = false;
  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "Display",
        "bTopMostWindow",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean("Prefs", "Display", "bTopMostWindow", value);
      await ini.setBooleanIfPresent(
        "Custom",
        "Display",
        "bTopMostWindow",
        value,
      );
    },
    defaultValue,
  );
}
