import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useAskScrapFavorite() {
  const defaultValue = true;

  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "MAIN",
        "bAskScrapFavorite",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean("Prefs", "MAIN", "bAskScrapFavorite", value);
      await ini.setBooleanIfPresent(
        "Custom",
        "MAIN",
        "bAskScrapFavorite",
        value,
      );
    },
    defaultValue,
  );
}
