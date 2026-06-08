import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useConversationHistorySize() {
  const defaultValue = 4.0;
  return useTweak<number>(
    () =>
      ini.findFloatWithDefault(
        ["Custom", "Prefs"],
        "Display",
        "fConversationHistorySize",
        defaultValue,
      ),
    async (value) => {
      await ini.setFloat("Prefs", "Display", "fConversationHistorySize", value);
      await ini.setFloatIfPresent(
        "Custom",
        "Display",
        "fConversationHistorySize",
        value,
      );
    },
    defaultValue,
  );
}
