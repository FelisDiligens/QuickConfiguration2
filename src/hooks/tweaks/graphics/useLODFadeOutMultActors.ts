import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useLODFadeOutMultActors() {
  const defaultValue = 4.5;

  return useTweak<number>(
    () =>
      ini.findFloatWithDefault(
        ["Custom", "Prefs"],
        "LOD",
        "fLODFadeOutMultActors",
        defaultValue,
      ),
    async (value) => {
      await ini.setFloat("Prefs", "LOD", "fLODFadeOutMultActors", value);
      await ini.setFloatIfPresent(
        "Custom",
        "LOD",
        "fLODFadeOutMultActors",
        value,
      );
    },
    defaultValue,
  );
}
