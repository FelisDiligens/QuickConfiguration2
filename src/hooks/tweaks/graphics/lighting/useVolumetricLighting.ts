import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useVolumetricLighting() {
  const defaultValue = true;

  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "Display",
        "bVolumetricLightingEnable",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean(
        "Prefs",
        "Display",
        "bVolumetricLightingEnable",
        value,
      );
      await ini.setBooleanIfPresent(
        "Custom",
        "Display",
        "bVolumetricLightingEnable",
        value,
      );
    },
    defaultValue,
  );
}
