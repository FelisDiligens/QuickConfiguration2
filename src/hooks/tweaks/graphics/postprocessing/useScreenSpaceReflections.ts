import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

/**
 * Enables reflections on shiny surfaces like water, puddles, and metals.
 * ⚠️ If disabled, may result in pitch black, milk white, or invisible water.
 */
export default function useScreenSpaceReflections() {
  const defaultValue = true;

  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "LightingShader",
        "bScreenSpaceReflections",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean(
        "Prefs",
        "LightingShader",
        "bScreenSpaceReflections",
        value,
      );
      await ini.setBooleanIfPresent(
        "Custom",
        "LightingShader",
        "bScreenSpaceReflections",
        value,
      );
    },
    defaultValue,
  );
}
