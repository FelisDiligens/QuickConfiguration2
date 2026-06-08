import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

/** By how much you can zoom out in 3rd person view */
export default function useVanityModeMaxDist() {
  const defaultValue = 150;

  return useTweak<number>(
    () =>
      ini.findFloatWithDefault(
        ["Custom", "Prefs"],
        "Camera",
        "fVanityModeMaxDist",
        defaultValue,
      ),
    async (value) => {
      if (value == defaultValue) {
        await ini.delete("Custom", "Camera", "fVanityModeMaxDist");
      } else {
        await ini.setFloat("Custom", "Camera", "fVanityModeMaxDist", value);
      }
    },
    defaultValue,
  );
}
