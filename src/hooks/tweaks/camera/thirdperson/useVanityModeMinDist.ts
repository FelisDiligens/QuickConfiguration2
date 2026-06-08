import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

/** By how much you can zoom in in 3rd person view */
export default function useVanityModeMinDist() {
  const defaultValue = 0;

  return useTweak<number>(
    () =>
      ini.findFloatWithDefault(
        ["Custom", "Prefs"],
        "Camera",
        "fVanityModeMinDist",
        defaultValue,
      ),
    async (value) => {
      if (value == defaultValue) {
        await ini.delete("Custom", "Camera", "fVanityModeMinDist");
      } else {
        await ini.setFloat("Custom", "Camera", "fVanityModeMinDist", value);
      }
    },
    defaultValue,
  );
}
