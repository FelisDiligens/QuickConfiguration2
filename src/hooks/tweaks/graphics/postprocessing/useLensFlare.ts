import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useLensFlare() {
  const defaultValue = true;

  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "ImageSpace",
        "bLensFlare",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean("Prefs", "ImageSpace", "bLensFlare", value);
      await ini.setBooleanIfPresent(
        "Custom",
        "ImageSpace",
        "bLensFlare",
        value,
      );
      if (value) {
        // default is 0.25
        await ini.delete("Custom", "Display", "fIBLensFlaresGlobalIntensity");
      } else {
        await ini.setFloat(
          "Custom",
          "Display",
          "fIBLensFlaresGlobalIntensity",
          0,
        );
      }
    },
    defaultValue,
  );
}
