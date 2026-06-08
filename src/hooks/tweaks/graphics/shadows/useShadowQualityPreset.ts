import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export enum ShadowQuality {
  Low = 0,
  Medium = 1,
  High = 2,
  Ultra = 3,
  Custom = 4,
}

interface Values {
  iShadowMapResolution: number;
  uiShadowFilter: number;
  uiOrthoShadowFilter: number;
  fBlendSplitDirShadow: number;
  iMaxFocusShadows: number;
}

const valueMap: Record<Exclude<ShadowQuality, ShadowQuality.Custom>, Values> = {
  [ShadowQuality.Low]: {
    iShadowMapResolution: 1024,
    uiShadowFilter: 0,
    uiOrthoShadowFilter: 0,
    fBlendSplitDirShadow: 0,
    iMaxFocusShadows: 0,
  },
  [ShadowQuality.Medium]: {
    iShadowMapResolution: 2048,
    uiShadowFilter: 1,
    uiOrthoShadowFilter: 1,
    fBlendSplitDirShadow: 48,
    iMaxFocusShadows: 1,
  },
  [ShadowQuality.High]: {
    iShadowMapResolution: 2048,
    uiShadowFilter: 2,
    uiOrthoShadowFilter: 2,
    fBlendSplitDirShadow: 48,
    iMaxFocusShadows: 4,
  },
  [ShadowQuality.Ultra]: {
    iShadowMapResolution: 2048,
    uiShadowFilter: 3,
    uiOrthoShadowFilter: 3,
    fBlendSplitDirShadow: 48,
    iMaxFocusShadows: 4,
  },
};

export default function useShadowQualityPreset() {
  const defaultValue = ShadowQuality.Ultra;
  const reloadNecessary = true;

  return useTweak<ShadowQuality>(
    async () => {
      // Get values from ini file:
      const iShadowMapResolution = await ini.findIntWithDefault(
        ["Custom", "Prefs"],
        "Display",
        "iShadowMapResolution",
        2048,
      );
      const uiShadowFilter = await ini.findIntWithDefault(
        ["Custom", "Prefs"],
        "Display",
        "uiShadowFilter",
        3,
      );
      const uiOrthoShadowFilter = await ini.findIntWithDefault(
        ["Custom", "Prefs"],
        "Display",
        "uiOrthoShadowFilter",
        3,
      );
      const fBlendSplitDirShadow = await ini.findFloatWithDefault(
        ["Custom", "Prefs"],
        "Display",
        "fBlendSplitDirShadow",
        48.0,
      );
      const iMaxFocusShadows = await ini.findIntWithDefault(
        ["Custom", "Prefs"],
        "Display",
        "iMaxFocusShadows",
        4,
      );

      // Determine which preset was applied:
      for (const preset of [
        ShadowQuality.Low,
        ShadowQuality.Medium,
        ShadowQuality.High,
        ShadowQuality.Ultra,
      ]) {
        const values =
          valueMap[preset as Exclude<ShadowQuality, ShadowQuality.Custom>];

        if (
          values.iShadowMapResolution === iShadowMapResolution &&
          values.uiShadowFilter === uiShadowFilter &&
          values.uiOrthoShadowFilter === uiOrthoShadowFilter &&
          values.fBlendSplitDirShadow === fBlendSplitDirShadow &&
          values.iMaxFocusShadows === iMaxFocusShadows
        ) {
          return preset;
        }
      }

      // If no exact match was found, return "Custom":
      return ShadowQuality.Custom;
    },
    async (value) => {
      if (value === ShadowQuality.Custom) return; // Do nothing as to not overwrite any settings, when "Custom" is set.
      const values = valueMap[value]; // Get the values that correspond to the preset.

      // Set all ini values according to the preset:
      await ini.setInt(
        "Prefs",
        "Display",
        "iShadowMapResolution",
        values.iShadowMapResolution,
      );
      await ini.setInt(
        "Prefs",
        "Display",
        "uiShadowFilter",
        values.uiShadowFilter,
      );
      await ini.setInt(
        "Prefs",
        "Display",
        "uiOrthoShadowFilter",
        values.uiOrthoShadowFilter,
      );
      await ini.setFloat(
        "Prefs",
        "Display",
        "fBlendSplitDirShadow",
        values.fBlendSplitDirShadow,
      );
      await ini.setInt(
        "Prefs",
        "Display",
        "iMaxFocusShadows",
        values.iMaxFocusShadows,
      );
    },
    defaultValue,
    reloadNecessary,
  );
}
