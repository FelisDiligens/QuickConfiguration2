import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useShowOtherPlayersNames() {
  const defaultValue = true;

  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "Display",
        "bShowOtherPlayersNames",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean("Prefs", "Display", "bShowOtherPlayersNames", value);
      await ini.setBooleanIfPresent(
        "Custom",
        "Display",
        "bShowOtherPlayersNames",
        value,
      );
    },
    defaultValue,
  );
}
