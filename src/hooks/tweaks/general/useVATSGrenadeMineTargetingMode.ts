import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";
import { clamp } from "@/utils/math";

export enum VATSGrenadeMineTargetingMode {
  None = 0,
  OnlyMyOwn = 1,
  All = 2,
}

export default function useVATSGrenadeMineTargetingMode() {
  const defaultValue = VATSGrenadeMineTargetingMode.All;

  return useTweak<VATSGrenadeMineTargetingMode>(
    async () => {
      let value = await ini.findIntWithDefault(
        ["Custom", "Prefs"],
        "Gameplay",
        "uVATSGrenadeMineTargetingMode",
        defaultValue,
      );

      value = clamp(value, 0, 2);

      return value as VATSGrenadeMineTargetingMode;
    },
    async (value) => {
      await ini.setInt(
        "Prefs",
        "Gameplay",
        "uVATSGrenadeMineTargetingMode",
        value,
      );
    },
    defaultValue,
  );
}
