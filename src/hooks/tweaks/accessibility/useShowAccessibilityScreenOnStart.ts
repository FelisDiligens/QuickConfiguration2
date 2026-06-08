import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useShowAccessibilityScreenOnStart() {
  const defaultValue = false;

  return useTweak<boolean>(
    async () =>
      !(await ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "Accessibility",
        "bHasHadFirstTimeAccessilbility",
        defaultValue,
      )),
    async (value) =>
      await ini.setBoolean(
        "Prefs",
        "Accessibility",
        "bHasHadFirstTimeAccessilbility",
        !value,
      ),
    defaultValue,
  );
}
