import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useAnisotropicFiltering() {
  const defaultValue = 16;
  return useTweak<number>(
    () =>
      ini.findIntWithDefault(
        ["Custom", "Prefs"],
        "Display",
        "iMaxAnisotropy",
        defaultValue,
      ),
    async (value) => {
      await ini.setInt("Prefs", "Display", "iMaxAnisotropy", value);
      await ini.setIntIfPresent("Custom", "Display", "iMaxAnisotropy", value);
    },
    defaultValue,
  );
}
