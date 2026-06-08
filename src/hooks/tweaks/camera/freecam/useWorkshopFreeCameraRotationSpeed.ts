import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useWorkshopFreeCameraRotationSpeed() {
  const defaultValue = 3.0;

  return useTweak<number>(
    () =>
      ini.findFloatWithDefault(
        ["Custom", "Prefs"],
        "Workshop",
        "fWorkshopFreeCameraRotationSpeed",
        defaultValue,
      ),
    async (value) => {
      await ini.setFloat(
        "Prefs",
        "Workshop",
        "fWorkshopFreeCameraRotationSpeed",
        value,
      );
      await ini.setFloatIfPresent(
        "Custom",
        "Workshop",
        "fWorkshopFreeCameraRotationSpeed",
        value,
      );
    },
    defaultValue,
  );
}
