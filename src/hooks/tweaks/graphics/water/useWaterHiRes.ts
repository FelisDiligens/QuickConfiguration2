import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useWaterHiRes() {
  const defaultValue = false;
  const reloadNecessary = true;

  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "Water",
        "bUseWaterHiRes",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean("Prefs", "Water", "bUseWaterHiRes", value);
      await ini.setBooleanIfPresent("Custom", "Water", "bUseWaterHiRes", value);
    },
    defaultValue,
    reloadNecessary,
  );
}
