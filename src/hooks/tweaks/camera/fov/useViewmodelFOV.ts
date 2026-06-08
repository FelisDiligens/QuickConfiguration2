import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

/**
 * Viewmodel FOV: affects your hands, gun, Pip-Boy, etc.
 * Also affects aim down sight zoom amount.
 */
export default function useViewmodelFOV() {
  const defaultValue = 80;
  return useTweak<number>(
    () =>
      ini.getFloatWithDefault(
        "Custom",
        "Display",
        "fDefault1stPersonFOV",
        defaultValue,
      ),
    async (value) => {
      await ini.setFloat("Custom", "Display", "fDefault1stPersonFOV", value);
    },
    defaultValue,
  );
}
