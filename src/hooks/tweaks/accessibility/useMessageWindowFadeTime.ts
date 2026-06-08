import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

/** Time In Seconds */
export default function useMessageWindowFadeTime() {
  const defaultValue = 3.0;

  return useTweak<number>(
    () =>
      ini.findFloatWithDefault(
        ["Custom", "Prefs"],
        "Accessibility",
        "fMessageFadeOptionSpeed",
        defaultValue,
      ),
    async (value) => {
      await ini.setFloat(
        "Prefs",
        "Accessibility",
        "fMessageFadeOptionSpeed",
        value,
      );
      await ini.setFloatIfPresent(
        "Custom",
        "Accessibility",
        "fMessageFadeOptionSpeed",
        value,
      );
    },
    defaultValue,
  );
}
