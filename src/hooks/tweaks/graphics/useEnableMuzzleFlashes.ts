import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useEnableMuzzleFlashes() {
  const defaultValue = true;

  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "MAIN",
        "bEnableMuzzleFlashes",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean("Prefs", "MAIN", "bEnableMuzzleFlashes", value);
      await ini.setBooleanIfPresent(
        "Custom",
        "MAIN",
        "bEnableMuzzleFlashes",
        value,
      );
    },
    defaultValue,
  );
}
