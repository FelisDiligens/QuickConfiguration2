import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

/**
 * Sets the distance grass will begin to fade.
 * - Ultra is 7000
 * - High is 5500
 * - Medium is 4500
 */
export default function useGrassFadeDistance() {
  const defaultValue = 3000.0;

  return useTweak<number>(
    () =>
      ini.findFloatWithDefault(
        ["Custom", "Prefs"],
        "Grass",
        "fGrassStartFadeDistance",
        defaultValue,
      ),
    async (value) => {
      await ini.setFloat("Prefs", "Grass", "fGrassStartFadeDistance", value);
      await ini.setFloatIfPresent(
        "Custom",
        "Grass",
        "fGrassStartFadeDistance",
        value,
      );
      await ini.setFloat("Prefs", "Grass", "fGrassMinStartFadeDistance", 0);
      await ini.setFloatIfPresent(
        "Custom",
        "Grass",
        "fGrassMinStartFadeDistance",
        0,
      );
      await ini.setFloat("Prefs", "Grass", "fGrassMaxStartFadeDistance", value);
      await ini.setFloatIfPresent(
        "Custom",
        "Grass",
        "fGrassMaxStartFadeDistance",
        value,
      );
    },
    defaultValue,
  );
}
