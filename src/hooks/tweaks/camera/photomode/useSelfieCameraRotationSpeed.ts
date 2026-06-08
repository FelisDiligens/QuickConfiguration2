import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useSelfieCameraRotationSpeed() {
  const defaultValue = 1.5;

  return useTweak<number>(
    () =>
      ini.findFloatWithDefault(
        ["Custom", "Prefs"],
        "Camera",
        "fSelfieCameraRotationSpeed",
        defaultValue,
      ),
    async (value) => {
      if (value == defaultValue) {
        await ini.delete("Custom", "Camera", "fSelfieCameraRotationSpeed");
      } else {
        await ini.setFloat(
          "Custom",
          "Camera",
          "fSelfieCameraRotationSpeed",
          value,
        );
      }
    },
    defaultValue,
  );
}
