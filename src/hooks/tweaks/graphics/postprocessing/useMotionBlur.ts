import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useMotionBlur() {
  const defaultValue = true;

  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "ImageSpace",
        "bMBEnable",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean("Prefs", "ImageSpace", "bMBEnable", value);
      await ini.setBooleanIfPresent("Custom", "ImageSpace", "bMBEnable", value);
    },
    defaultValue,
  );
}
