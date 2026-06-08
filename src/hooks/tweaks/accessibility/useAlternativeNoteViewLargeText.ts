import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useAlternativeNoteViewLargeText() {
  const defaultValue = false;

  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "Interface",
        "bUseLargeEasyReadText",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean(
        "Prefs",
        "Interface",
        "bUseLargeEasyReadText",
        value,
      );
      await ini.setBooleanIfPresent(
        "Custom",
        "Interface",
        "bUseLargeEasyReadText",
        value,
      );
    },
    defaultValue,
  );
}
