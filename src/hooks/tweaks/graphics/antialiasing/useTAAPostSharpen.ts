import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

/**
 * Sharpening amount post-TAA.
 * Increasing this value too much causes flickering on screen.
 */
export default function useTAAPostSharpen() {
  const defaultValue = 0.21;

  return useTweak<number>(
    () =>
      ini.findFloatWithDefault(
        ["Custom", "Prefs"],
        "Display",
        "fTAAPostSharpen",
        defaultValue,
      ),
    (value) => ini.setFloat("Custom", "Display", "fTAAPostSharpen", value),
    defaultValue,
  );
}
