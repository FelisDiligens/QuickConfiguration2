import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useShowCAMPWeather() {
  const defaultValue = true;

  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "Workshop",
        "bClientShowWorkshopWeatherOverride",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean(
        "Prefs",
        "Workshop",
        "bClientShowWorkshopWeatherOverride",
        value,
      );
      await ini.setBooleanIfPresent(
        "Custom",
        "Workshop",
        "bClientShowWorkshopWeatherOverride",
        value,
      );
    },
    defaultValue,
  );
}
