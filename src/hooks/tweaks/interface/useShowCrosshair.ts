import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useShowCrosshair() {
  const defaultValue = true;
  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "MAIN",
        "bCrosshairEnabled",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean("Prefs", "MAIN", "bCrosshairEnabled", value);
      await ini.setBooleanIfPresent(
        "Custom",
        "MAIN",
        "bCrosshairEnabled",
        value,
      );
    },
    defaultValue,
  );
}
