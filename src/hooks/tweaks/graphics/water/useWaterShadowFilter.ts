import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useWaterShadowFilter() {
  const defaultValue = 1;
  const reloadNecessary = true;

  return useTweak<number>(
    () =>
      ini.findIntWithDefault(
        ["Custom", "Prefs"],
        "Display",
        "uWaterShadowFilter",
        defaultValue,
      ),
    async (value) => {
      await ini.setInt("Prefs", "Display", "uWaterShadowFilter", value);
      await ini.setIntIfPresent(
        "Custom",
        "Display",
        "uWaterShadowFilter",
        value,
      );
    },
    defaultValue,
    reloadNecessary,
  );
}
