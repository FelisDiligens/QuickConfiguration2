import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useAutoScrollPipboyItemStats() {
  const defaultValue = false;

  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "Display",
        "bAutoScrollPipboyItemStats",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean(
        "Prefs",
        "Display",
        "bAutoScrollPipboyItemStats",
        value,
      );
      await ini.setBooleanIfPresent(
        "Custom",
        "Display",
        "bAutoScrollPipboyItemStats",
        value,
      );
    },
    defaultValue,
  );
}
