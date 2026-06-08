import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";
import { clamp } from "@/utils/math";

export enum ActiveEffectsOnHUD {
  Disabled = 0,
  Detrimental = 1,
  All = 2,
}

export default function useActiveEffectsOnHUD() {
  const defaultValue = ActiveEffectsOnHUD.All;
  return useTweak<ActiveEffectsOnHUD>(
    async () => {
      const val = await ini.findIntWithDefault(
        ["Custom", "Prefs"],
        "Interface",
        "uHUDActiveEffectWidget",
        defaultValue,
      );
      return clamp(val, 0, 2);
    },
    async (value) => {
      await ini.setInt("Prefs", "Interface", "uHUDActiveEffectWidget", value);
      await ini.setIntIfPresent(
        "Custom",
        "Interface",
        "uHUDActiveEffectWidget",
        value,
      );
    },
    defaultValue,
  );
}
