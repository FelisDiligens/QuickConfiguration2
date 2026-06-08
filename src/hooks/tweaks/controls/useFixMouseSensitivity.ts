import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";
import { approxEq } from "@/utils/math";

// This tweak is completely obsolete. The game now matches X/Y mouse sensitivity.
export default function useFixMouseSensitivity() {
  const defaultValue = false;
  return useTweak<boolean>(
    async () => {
      const x = await ini.findFloatWithDefault(
        ["Custom", "Prefs"],
        "Controls",
        "fMouseHeadingXScale",
        0.021,
      );
      const y = await ini.findFloatWithDefault(
        ["Custom", "Prefs"],
        "Controls",
        "fMouseHeadingYScale",
        0.021,
      );
      return x !== y;
    },
    async (value) => {
      if (value) {
        const width = await ini.findIntWithDefault(
          ["Custom", "Prefs"],
          "Display",
          "iSize W",
          1920,
        );
        const height = await ini.findIntWithDefault(
          ["Custom", "Prefs"],
          "Display",
          "iSize H",
          1080,
        );
        const aspectRatio = width / height;
        let yScale: number;

        // 16:9
        if (approxEq(aspectRatio, 16 / 9)) {
          yScale = 0.03738;
        }
        // 16:10
        else if (approxEq(aspectRatio, 16 / 10)) {
          yScale = 0.0336;
        }
        // 21:9
        else if (approxEq(aspectRatio, 21 / 9)) {
          yScale = 0.042;
        }
        // 4:3
        else if (approxEq(aspectRatio, 4 / 3)) {
          yScale = 0.028;
        }
        // Unknown aspect ratio
        else {
          yScale = aspectRatio * 0.021;
        }

        await ini.setFloat("Custom", "Controls", "fMouseHeadingXScale", 0.021);
        await ini.setFloat("Custom", "Controls", "fMouseHeadingYScale", yScale);
        await ini.setFloat("Custom", "Controls", "fPitchSpeedRatio", 1.0);
        await ini.setFloat(
          "Custom",
          "Controls",
          "fIronSightsPitchSpeedRatio",
          1.0,
        );
      } else {
        await ini.delete("Custom", "Controls", "fMouseHeadingXScale");
        await ini.delete("Custom", "Controls", "fMouseHeadingYScale");
        await ini.delete("Custom", "Controls", "fPitchSpeedRatio");
        await ini.delete("Custom", "Controls", "fIronSightsPitchSpeedRatio");
      }
    },
    defaultValue,
  );
}
