import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useRadialBlur() {
  const defaultValue = true;

  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "Imagespace",
        "bDoRadialBlur",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean("Prefs", "Imagespace", "bDoRadialBlur", value);
      await ini.setBooleanIfPresent(
        "Custom",
        "Imagespace",
        "bDoRadialBlur",
        value,
      );
    },
    defaultValue,
  );
}
