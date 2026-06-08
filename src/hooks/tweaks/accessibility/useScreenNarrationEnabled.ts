import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useScreenNarrationEnabled() {
  const defaultValue = false;

  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "Accessibility",
        "bScreenNarrationEnabled",
        defaultValue,
      ),
    (value) =>
      ini.setBoolean(
        "Prefs",
        "Accessibility",
        "bScreenNarrationEnabled",
        value,
      ),
    defaultValue,
  );
}
