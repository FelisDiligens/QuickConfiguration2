import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useWorkshopStartInFreeCamera() {
  const defaultValue = false;

  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "Workshop",
        "bWorkshopStartInFreeCamera",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean(
        "Prefs",
        "Workshop",
        "bWorkshopStartInFreeCamera",
        value,
      );
      await ini.setBooleanIfPresent(
        "Custom",
        "Workshop",
        "bWorkshopStartInFreeCamera",
        value,
      );
    },
    defaultValue,
  );
}
