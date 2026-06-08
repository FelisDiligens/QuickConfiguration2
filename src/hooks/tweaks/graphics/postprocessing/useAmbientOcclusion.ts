import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useAmbientOcclusion() {
  const defaultValue = true;

  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "Display",
        "bSAOEnable",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean("Prefs", "Display", "bSAOEnable", value);
      await ini.setBooleanIfPresent("Custom", "Display", "bSAOEnable", value);
    },
    defaultValue,
  );
}
