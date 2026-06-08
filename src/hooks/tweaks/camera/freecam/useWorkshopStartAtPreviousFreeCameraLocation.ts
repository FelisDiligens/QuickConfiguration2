import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useWorkshopStartAtPreviousFreeCameraLocation() {
  const defaultValue = true;

  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "Workshop",
        "bWorkshopFreeCameraStartAtPreviousFreeCameraLocation",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean(
        "Prefs",
        "Workshop",
        "bWorkshopFreeCameraStartAtPreviousFreeCameraLocation",
        value,
      );
      await ini.setBooleanIfPresent(
        "Custom",
        "Workshop",
        "bWorkshopFreeCameraStartAtPreviousFreeCameraLocation",
        value,
      );
    },
    defaultValue,
  );
}
