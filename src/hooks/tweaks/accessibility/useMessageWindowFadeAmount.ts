import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

/** Opacity between 1 and 10 */
export default function useMessageWindowFadeAmount() {
  const defaultValue = 3.0;

  return useTweak<number>(
    () =>
      ini.findFloatWithDefault(
        ["Custom", "Prefs"],
        "Accessibility",
        "fMessageFadeAmountOption",
        defaultValue,
      ),
    async (value) => {
      await ini.setFloat(
        "Prefs",
        "Accessibility",
        "fMessageFadeAmountOption",
        value,
      );
      await ini.setFloatIfPresent(
        "Custom",
        "Accessibility",
        "fMessageFadeAmountOption",
        value,
      );
    },
    defaultValue,
  );
}
