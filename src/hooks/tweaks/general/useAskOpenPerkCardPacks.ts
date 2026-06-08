import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useAskOpenPerkCardPacks() {
  const defaultValue = true;

  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "MAIN",
        "bAskOpenPerkCardPacks",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean("Prefs", "MAIN", "bAskOpenPerkCardPacks", value);
      await ini.setBooleanIfPresent(
        "Custom",
        "MAIN",
        "bAskOpenPerkCardPacks",
        value,
      );
    },
    defaultValue,
  );
}
