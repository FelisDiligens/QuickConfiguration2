import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useSingleButtonNotificationCancel() {
  const defaultValue = false;

  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "Accessibility",
        "bAltFastTravelControl",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean(
        "Prefs",
        "Accessibility",
        "bAltFastTravelControl",
        value,
      );
      await ini.setBooleanIfPresent(
        "Custom",
        "Accessibility",
        "bAltFastTravelControl",
        value,
      );
    },
    defaultValue,
  );
}
