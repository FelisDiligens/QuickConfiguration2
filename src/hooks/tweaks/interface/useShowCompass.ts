import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useShowCompass() {
  const defaultValue = true;
  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "Interface",
        "bShowCompass",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean("Prefs", "Interface", "bShowCompass", value);
      await ini.setBooleanIfPresent(
        "Custom",
        "Interface",
        "bShowCompass",
        value,
      );
    },
    defaultValue,
  );
}
