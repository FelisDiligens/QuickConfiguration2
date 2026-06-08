import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useFasterFadeIn() {
  const defaultValue = false;
  return useTweak<boolean>(
    () => ini.has("Custom", "Interface", "fFadeToBlackFadeSeconds"),
    async (value) => {
      if (value) {
        await ini.setFloat(
          "Custom",
          "Interface",
          "fFadeToBlackFadeSeconds",
          0.2,
        );
        await ini.setFloat(
          "Custom",
          "Interface",
          "fMinSecondsForLoadFadeIn",
          0.3,
        );
      } else {
        await ini.delete("Custom", "Interface", "fFadeToBlackFadeSeconds");
        await ini.delete("Custom", "Interface", "fMinSecondsForLoadFadeIn");
      }
    },
    defaultValue,
  );
}
