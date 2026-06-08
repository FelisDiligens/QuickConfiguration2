import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useQuickBoyModeEnabled() {
  const defaultValue = false;

  return useTweak(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "Pipboy",
        "bQuickboyMode",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean("Prefs", "Pipboy", "bQuickboyMode", value);
      await ini.setBooleanIfPresent("Custom", "Pipboy", "bQuickboyMode", value);
    },
    defaultValue,
  );
}
