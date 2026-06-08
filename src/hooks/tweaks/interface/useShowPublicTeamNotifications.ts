import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useShowPublicTeamNotifications() {
  const defaultValue = true;
  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "GamePlay",
        "bShowPublicTeamNotifications",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean(
        "Prefs",
        "GamePlay",
        "bShowPublicTeamNotifications",
        value,
      );
      await ini.setBooleanIfPresent(
        "Custom",
        "GamePlay",
        "bShowPublicTeamNotifications",
        value,
      );
    },
    defaultValue,
  );
}
