import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useEnablePowerArmorHUD() {
  const defaultValue = true;
  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "MAIN",
        "bEnablePowerArmorHUD",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean("Prefs", "MAIN", "bEnablePowerArmorHUD", value);
      await ini.setBooleanIfPresent(
        "Custom",
        "MAIN",
        "bEnablePowerArmorHUD",
        value,
      );
    },
    defaultValue,
  );
}
