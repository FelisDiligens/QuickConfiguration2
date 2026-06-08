import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useShadowBlurriness() {
  const defaultValue = 3;
  const reloadNecessary = true;

  return useTweak<number>(
    () =>
      ini.findIntWithDefault(
        ["Custom", "Prefs"],
        "Display",
        "uiOrthoShadowFilter",
        defaultValue,
      ),
    async (value) => {
      await ini.setInt("Prefs", "Display", "uiShadowFilter", value);
      await ini.setIntIfPresent("Custom", "Display", "uiShadowFilter", value);
      await ini.setInt("Prefs", "Display", "uiOrthoShadowFilter", value);
      await ini.setIntIfPresent(
        "Custom",
        "Display",
        "uiOrthoShadowFilter",
        value,
      );
    },
    defaultValue,
    reloadNecessary,
  );
}
