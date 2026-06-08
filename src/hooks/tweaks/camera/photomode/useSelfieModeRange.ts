import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useSelfieModeRange() {
  const defaultValue = 500;

  return useTweak<number>(
    () =>
      ini.findFloatWithDefault(
        ["Custom", "Prefs"],
        "Camera",
        "fSelfieModeRange",
        defaultValue,
      ),
    async (value) => {
      if (value == defaultValue) {
        await ini.delete("Custom", "Camera", "fSelfieModeRange");
      } else {
        await ini.setFloat("Custom", "Camera", "fSelfieModeRange", value);
      }
    },
    defaultValue,
  );
}
