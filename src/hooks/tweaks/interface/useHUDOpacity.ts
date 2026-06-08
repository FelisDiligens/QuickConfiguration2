import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useHUDOpacity() {
  const defaultValue = 1.0;
  return useTweak<number>(
    () =>
      ini.findFloatWithDefault(
        ["Custom", "Prefs"],
        "MAIN",
        "fHUDOpacity",
        defaultValue,
      ),
    async (value) => {
      await ini.setFloat("Prefs", "MAIN", "fHUDOpacity", value);
      await ini.setFloatIfPresent("Custom", "MAIN", "fHUDOpacity", value);
    },
    defaultValue,
  );
}
