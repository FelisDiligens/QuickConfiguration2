import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useShowGrenadeTrajectory() {
  const defaultValue = false;

  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "MAIN",
        "bShowGrenadeTrajectory",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean("Prefs", "MAIN", "bShowGrenadeTrajectory", value);
      await ini.setBooleanIfPresent(
        "Custom",
        "MAIN",
        "bShowGrenadeTrajectory",
        value,
      );
    },
    defaultValue,
  );
}
