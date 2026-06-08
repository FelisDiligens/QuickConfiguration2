import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useShadowDistance() {
  const defaultValue = 90000.0;

  return useTweak<number>(
    () =>
      ini.findFloatWithDefault(
        ["Custom", "Prefs"],
        "Display",
        "fDirShadowDistance",
        defaultValue,
      ),
    async (value) => {
      await ini.setFloat("Prefs", "Display", "fDirShadowDistance", value);
      await ini.setFloatIfPresent(
        "Custom",
        "Display",
        "fDirShadowDistance",
        value,
      );
      await ini.setFloat("Prefs", "Display", "fShadowDistance", value);
      await ini.setFloatIfPresent(
        "Custom",
        "Display",
        "fShadowDistance",
        value,
      );
    },
    defaultValue,
  );
}
