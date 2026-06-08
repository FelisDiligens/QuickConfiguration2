import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useShowBackpack() {
  const defaultValue = true;
  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "MAIN",
        "bShowBackpack",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean("Prefs", "MAIN", "bShowBackpack", value);
      await ini.setBooleanIfPresent("Custom", "MAIN", "bShowBackpack", value);
    },
    defaultValue,
  );
}
