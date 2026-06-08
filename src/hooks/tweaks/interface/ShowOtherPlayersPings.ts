import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useShowOtherPlayersPings() {
  const defaultValue = true;

  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "Display",
        "bShowOtherPlayersPings",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean("Prefs", "Display", "bShowOtherPlayersPings", value);
      await ini.setBooleanIfPresent(
        "Custom",
        "Display",
        "bShowOtherPlayersPings",
        value,
      );
    },
    defaultValue,
  );
}
