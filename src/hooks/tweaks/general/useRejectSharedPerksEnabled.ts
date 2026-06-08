import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useRejectSharedPerksEnabled() {
  const defaultValue = false;

  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "MAIN",
        "bRejectSharedPerksEnabled",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean("Prefs", "MAIN", "bRejectSharedPerksEnabled", value);
      await ini.setBooleanIfPresent(
        "Custom",
        "MAIN",
        "bRejectSharedPerksEnabled",
        value,
      );
    },
    defaultValue,
  );
}
