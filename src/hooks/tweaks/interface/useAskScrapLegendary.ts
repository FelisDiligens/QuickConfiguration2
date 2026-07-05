import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useAskScrapLegendary() {
  const defaultValue = true;

  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "MAIN",
        "bAskScrapLegendary",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean("Prefs", "MAIN", "bAskScrapLegendary", value);
      await ini.setBooleanIfPresent(
        "Custom",
        "MAIN",
        "bAskScrapLegendary",
        value,
      );
    },
    defaultValue,
  );
}
