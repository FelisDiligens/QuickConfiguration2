import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useShowMapRegionNames() {
  const defaultValue = true;

  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "MAIN",
        "bShowMapRegionNames",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean("Prefs", "MAIN", "bShowMapRegionNames", value);
      await ini.setBooleanIfPresent(
        "Custom",
        "MAIN",
        "bShowMapRegionNames",
        value,
      );
    },
    defaultValue,
  );
}
