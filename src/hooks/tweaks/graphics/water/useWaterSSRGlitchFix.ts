import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useWaterSSRGlitchFix() {
  const defaultValue = false;
  const reloadNecessary = true;

  return useTweak<boolean>(
    async () => {
      // Since it's a tweak that doesn't correspond to any particular ini value,
      // it could annoy the user if it's enabled by default...
      // So, in the old C# codebase, this value in the legacy "config.ini" was checked:
      // if (
      //   !(await ini.getBooleanWithDefault(
      //     "Config",
      //     "Tweaks",
      //     "bFixSSRBlackWaterGlitch",
      //     false,
      //   ))
      // ) {
      //   return false;
      // }

      // Get values from ini file:
      const bUseWaterHiRes = await ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "Water",
        "bUseWaterHiRes",
        false,
      );
      const bUseWaterReflections = await ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "Water",
        "bUseWaterReflections",
        true,
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
      const uWaterShadowFilter = await ini.findIntWithDefault(
        ["Custom", "Prefs"],
        "Display",
        "uWaterShadowFilter",
        4,
      );

      // Check, if the values are set incorrectly:
      if (
        bUseWaterHiRes !== true ||
        bUseWaterReflections !== true ||
        fBlendSplitDirShadow < 1 ||
        iMaxFocusShadows < 1 ||
        uWaterShadowFilter !== 3
      ) {
        return false;
      }

      return true;
    },
    async (value) => {
      // In the old C# codebase, this was written to the legacy "config.ini":
      // await ini.setBoolean(
      //   "Config",
      //   "Tweaks",
      //   "bFixSSRBlackWaterGlitch",
      //   value,
      // );

      if (value) {
        // Fixes black water:
        await ini.setBoolean("Prefs", "Water", "bUseWaterHiRes", true);
        await ini.setBooleanIfPresent(
          "Custom",
          "Water",
          "bUseWaterHiRes",
          true,
        );

        // Fixes (distant) invisible water:
        await ini.setBoolean("Prefs", "Water", "bUseWaterReflections", true);
        await ini.setBooleanIfPresent(
          "Custom",
          "Water",
          "bUseWaterReflections",
          true,
        );

        /*
         * Fixes invisible water:
         */

        const fBlendSplitDirShadow = await ini.findFloatWithDefault(
          ["Custom", "Prefs"],
          "Display",
          "fBlendSplitDirShadow",
          48.0,
        );
        if (fBlendSplitDirShadow < 1) {
          await ini.setFloat("Prefs", "Display", "fBlendSplitDirShadow", 48.0);
          await ini.setFloatIfPresent(
            "Custom",
            "Display",
            "fBlendSplitDirShadow",
            48.0,
          );
        }

        const iMaxFocusShadows = await ini.findIntWithDefault(
          ["Custom", "Prefs"],
          "Display",
          "iMaxFocusShadows",
          4,
        );
        if (iMaxFocusShadows < 1) {
          await ini.setInt("Prefs", "Display", "iMaxFocusShadows", 4);
          await ini.setIntIfPresent("Custom", "Display", "iMaxFocusShadows", 4);
        }

        const uWaterShadowFilter = await ini.findIntWithDefault(
          ["Custom", "Prefs"],
          "Display",
          "uWaterShadowFilter",
          4,
        );
        if (uWaterShadowFilter !== 3) {
          await ini.setInt("Prefs", "Display", "uWaterShadowFilter", 3);
          await ini.setIntIfPresent(
            "Custom",
            "Display",
            "uWaterShadowFilter",
            3,
          );
        }
      }
    },
    defaultValue,
    reloadNecessary,
  );
}
