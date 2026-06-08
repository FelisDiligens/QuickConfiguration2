import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useEnableCameraShake() {
  const defaultValue = true;

  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "MAIN",
        "bEnableCameraShake",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean("Prefs", "MAIN", "bEnableCameraShake", value);
      await ini.setBooleanIfPresent(
        "Custom",
        "MAIN",
        "bEnableCameraShake",
        value,
      );
    },
    defaultValue,
  );
}
