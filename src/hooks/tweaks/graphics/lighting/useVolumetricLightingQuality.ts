import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";
import { clamp } from "@/utils/math";

export enum VolumetricLightingQuality {
  Low = 0,
  Medium = 1,
  High = 2,
}

export default function useVolumetricLightingQuality() {
  const defaultValue = VolumetricLightingQuality.Medium;
  const reloadNecessary = true;

  return useTweak<VolumetricLightingQuality>(
    async () => {
      let value = await ini.findIntWithDefault(
        ["Custom", "Prefs"],
        "Display",
        "iVolumetricLightingTextureQuality",
        defaultValue,
      );
      value = clamp(value, 0, 2);
      return value as VolumetricLightingQuality;
    },
    async (value) => {
      await ini.setInt(
        "Prefs",
        "Display",
        "iVolumetricLightingTextureQuality",
        value,
      );
      await ini.setIntIfPresent(
        "Custom",
        "Display",
        "iVolumetricLightingTextureQuality",
        value,
      );
    },
    defaultValue,
    reloadNecessary,
  );
}
