import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useAskScrapPremium() {
  const defaultValue = true;

  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "MAIN",
        "bAskScrapPremium",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean("Prefs", "MAIN", "bAskScrapPremium", value);
      await ini.setBooleanIfPresent(
        "Custom",
        "MAIN",
        "bAskScrapPremium",
        value,
      );
    },
    defaultValue,
  );
}
