import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useDepthOfFieldStrength() {
  const defaultValue = 10.0;

  return useTweak<number>(
    () =>
      ini.findFloatWithDefault(
        ["Custom", "Prefs"],
        "Display",
        "fDepthOfField_v1", // "fDepthOfFieldWST",
        defaultValue,
      ),
    async (value) => {
      await ini.setFloat(
        "Prefs",
        "Display",
        "fDepthOfField_v1", // "fDepthOfFieldWST",
        value,
      );
      await ini.setFloatIfPresent(
        "Custom",
        "Display",
        "fDepthOfField_v1", // "fDepthOfFieldWST",
        value,
      );
    },
    defaultValue,
  );
}
