import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useWorkshopFreeCameraTranslationSpeed() {
  const defaultValue = 15.0;

  return useTweak<number>(
    () =>
      ini.findFloatWithDefault(
        ["Custom", "Prefs"],
        "Workshop",
        "fWorkshopFreeCameraTranslationSpeed",
        defaultValue,
      ),
    async (value) => {
      await ini.setFloat(
        "Prefs",
        "Workshop",
        "fWorkshopFreeCameraTranslationSpeed",
        value,
      );
      await ini.setFloatIfPresent(
        "Custom",
        "Workshop",
        "fWorkshopFreeCameraTranslationSpeed",
        value,
      );
    },
    defaultValue,
  );
}
