import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useEnableIntenseWeatherEffects() {
  const defaultValue = true;

  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "Workshop",
        "bClientEnableIntenseLightEffects",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean(
        "Prefs",
        "Workshop",
        "bClientEnableIntenseLightEffects",
        value,
      );
      await ini.setBooleanIfPresent(
        "Custom",
        "Workshop",
        "bClientEnableIntenseLightEffects",
        value,
      );
    },
    defaultValue,
  );
}
