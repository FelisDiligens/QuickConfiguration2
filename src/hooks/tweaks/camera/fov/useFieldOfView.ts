import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

/**
 * Changes the Field of View of the 1st and 3rd person perspective.
 * This is the same value from the in-game FOV setting.
 */
export default function useFieldOfView() {
  const defaultValue = 80;
  return useTweak<number>(
    () =>
      ini.findFloatWithDefault(
        ["Custom", "Prefs"],
        "Display",
        "fDefaultWorldFOV",
        defaultValue,
      ),
    async (value) => {
      await ini.setFloat("Prefs", "Display", "fDefaultWorldFOV", value);
      await ini.setFloatIfPresent(
        "Custom",
        "Display",
        "fDefaultWorldFOV",
        value,
      );
    },
    defaultValue,
  );
}
