import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useLODFadeOutMultObjects() {
  const defaultValue = 6.0;

  return useTweak<number>(
    () =>
      ini.findFloatWithDefault(
        ["Custom", "Prefs"],
        "LOD",
        "fLODFadeOutMultObjects",
        defaultValue,
      ),
    async (value) => {
      await ini.setFloat("Prefs", "LOD", "fLODFadeOutMultObjects", value);
      await ini.setFloatIfPresent(
        "Custom",
        "LOD",
        "fLODFadeOutMultObjects",
        value,
      );
    },
    defaultValue,
  );
}
