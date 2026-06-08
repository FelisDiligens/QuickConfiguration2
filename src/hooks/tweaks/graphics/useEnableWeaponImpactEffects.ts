import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useEnableWeaponImpactEffects() {
  const defaultValue = true;

  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "MAIN",
        "bEnableWeaponImpactEffects",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean(
        "Prefs",
        "MAIN",
        "bEnableWeaponImpactEffects",
        value,
      );
      await ini.setBooleanIfPresent(
        "Custom",
        "MAIN",
        "bEnableWeaponImpactEffects",
        value,
      );
    },
    defaultValue,
  );
}
