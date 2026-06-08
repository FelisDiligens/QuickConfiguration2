import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useWaterDisplacements() {
  const defaultValue = true;

  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "Water",
        "bUseWaterDisplacements",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean("Prefs", "Water", "bUseWaterDisplacements", value);
      await ini.setBooleanIfPresent(
        "Custom",
        "Water",
        "bUseWaterDisplacements",
        value,
      );
    },
    defaultValue,
  );
}
