import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function usePipboyTargetResolution() {
  return useTweak(
    async () => ({
      width: await ini.findIntWithDefault(
        ["Custom", "Prefs"],
        "Display",
        "uPipboyTargetWidth",
        876,
      ),
      height: await ini.findIntWithDefault(
        ["Custom", "Prefs"],
        "Display",
        "uPipboyTargetHeight",
        700,
      ),
    }),
    async (value) => {
      const { width, height } = value;
      await ini.setInt("Prefs", "Display", "uPipboyTargetWidth", width);
      await ini.setIntIfPresent(
        "Custom",
        "Display",
        "uPipboyTargetWidth",
        width,
      );
      await ini.setInt("Prefs", "Display", "uPipboyTargetHeight", height);
      await ini.setIntIfPresent(
        "Custom",
        "Display",
        "uPipboyTargetHeight",
        height,
      );
    },
    { width: 876, height: 700 },
  );
}
