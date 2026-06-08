import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useWaterReflections() {
  const defaultValue = true;
  const reloadNecessary = true; // effects SSR fix

  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "Water",
        "bUseWaterReflections",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean("Prefs", "Water", "bUseWaterReflections", value);
      await ini.setBooleanIfPresent(
        "Custom",
        "Water",
        "bUseWaterReflections",
        value,
      );
    },
    defaultValue,
    reloadNecessary,
  );
}
