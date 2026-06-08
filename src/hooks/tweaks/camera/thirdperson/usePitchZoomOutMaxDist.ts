import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

/** By how much the camera gets zoomed out when you look at the ground in 3rd person. */
export default function usePitchZoomOutMaxDist() {
  const defaultValue = 100;

  return useTweak<number>(
    () =>
      ini.findFloatWithDefault(
        ["Custom", "Prefs"],
        "Camera",
        "fPitchZoomOutMaxDist",
        defaultValue,
      ),
    async (value) => {
      if (value == defaultValue) {
        await ini.delete("Custom", "Camera", "fPitchZoomOutMaxDist");
      } else {
        await ini.setFloat("Custom", "Camera", "fPitchZoomOutMaxDist", value);
      }
    },
    defaultValue,
  );
}
