import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

/**
 * Opacity of the sharpened overlay post-TAA. Increasing this value increases the visibility of the sharpened image on top of the blurry one.
 * Increasing this value too much causes flickering on screen.
 */
export default function useTAAPostOverlay() {
  const defaultValue = 0.21;

  return useTweak<number>(
    () =>
      ini.findFloatWithDefault(
        ["Custom", "Prefs"],
        "Display",
        "fTAAPostOverlay",
        defaultValue,
      ),
    (value) => ini.setFloat("Custom", "Display", "fTAAPostOverlay", value),
    defaultValue,
  );
}
