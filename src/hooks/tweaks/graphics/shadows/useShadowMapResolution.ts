import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useShadowMapResolution() {
  const defaultValue = 2048;
  const reloadNecessary = true;

  return useTweak<number>(
    () =>
      ini.findIntWithDefault(
        ["Custom", "Prefs"],
        "Display",
        "iShadowMapResolution",
        defaultValue,
      ),
    async (value) => {
      await ini.setInt("Prefs", "Display", "iShadowMapResolution", value);
      await ini.setIntIfPresent(
        "Custom",
        "Display",
        "iShadowMapResolution",
        value,
      );
    },
    defaultValue,
    reloadNecessary,
  );
}
