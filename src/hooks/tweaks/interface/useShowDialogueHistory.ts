import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useShowDialogueHistory() {
  const defaultValue = false;
  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "MAIN",
        "bShowDialogueHistory",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean("Prefs", "MAIN", "bShowDialogueHistory", value);
      await ini.setBooleanIfPresent(
        "Custom",
        "MAIN",
        "bShowDialogueHistory",
        value,
      );
    },
    defaultValue,
  );
}
