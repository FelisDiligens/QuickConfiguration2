import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useGamepadEnable() {
  const defaultValue = true;
  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "General",
        "bGamepadEnable",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean("Prefs", "General", "bGamepadEnable", value);
      await ini.setBooleanIfPresent(
        "Custom",
        "General",
        "bGamepadEnable",
        value,
      );
    },
    defaultValue,
  );
}
