import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useWorkshopFreeCameraControlsHoldToggle() {
  const defaultValue = false;

  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "Workshop",
        "bWorkshopFreeCameraControlsHoldToggle",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean(
        "Prefs",
        "Workshop",
        "bWorkshopFreeCameraControlsHoldToggle",
        value,
      );
      await ini.setBooleanIfPresent(
        "Custom",
        "Workshop",
        "bWorkshopFreeCameraControlsHoldToggle",
        value,
      );
    },
    defaultValue,
  );
}
