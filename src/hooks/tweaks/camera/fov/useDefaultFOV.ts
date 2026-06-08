import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useDefaultFOV() {
  const defaultValue = 80;
  return useTweak<number>(
    () =>
      ini.findFloatWithDefault(
        ["Custom", "Prefs"],
        "Camera",
        "fDefaultFOV",
        defaultValue,
      ),
    async (value) => {
      await ini.setFloat("Prefs", "Camera", "fDefaultFOV", value);
      await ini.setFloatIfPresent("Custom", "Camera", "fDefaultFOV", value);
    },
    defaultValue,
  );
}
