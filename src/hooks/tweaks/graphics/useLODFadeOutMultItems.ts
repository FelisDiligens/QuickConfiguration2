import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useLODFadeOutMultItems() {
  const defaultValue = 2.5;

  return useTweak<number>(
    () =>
      ini.findFloatWithDefault(
        ["Custom", "Prefs"],
        "LOD",
        "fLODFadeOutMultItems",
        defaultValue,
      ),
    async (value) => {
      await ini.setFloat("Prefs", "LOD", "fLODFadeOutMultItems", value);
      await ini.setFloatIfPresent(
        "Custom",
        "LOD",
        "fLODFadeOutMultItems",
        value,
      );
    },
    defaultValue,
  );
}
