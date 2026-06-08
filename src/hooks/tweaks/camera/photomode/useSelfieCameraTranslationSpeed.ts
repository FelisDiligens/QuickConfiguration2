import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useSelfieCameraTranslationSpeed() {
  const defaultValue = 2.5;

  return useTweak<number>(
    () =>
      ini.findFloatWithDefault(
        ["Custom", "Prefs"],
        "Camera",
        "fSelfieCameraTranslationSpeed",
        defaultValue,
      ),
    async (value) => {
      if (value == defaultValue) {
        await ini.delete("Custom", "Camera", "fSelfieCameraTranslationSpeed");
      } else {
        await ini.setFloat(
          "Custom",
          "Camera",
          "fSelfieCameraTranslationSpeed",
          value,
        );
      }
    },
    defaultValue,
  );
}
