import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";
import { approxEq } from "@/utils/math";

// This tweak is obsolete.
export default function useFixAimSensitivity() {
  const defaultValue = false;
  return useTweak<boolean>(
    async () => {
      const val = await ini.findFloatWithDefault(
        ["Custom", "Prefs"],
        "MAIN",
        "fIronSightsFOVRotateMult",
        1.0,
      );
      return approxEq(val, 2.14);
    },
    async (value) => {
      if (value) {
        await ini.setFloat(
          "Custom",
          "Controls",
          "fIronSightsFOVRotateMult",
          2.136363636,
        );
        await ini.setFloat(
          "Custom",
          "MAIN",
          "fIronSightsFOVRotateMult",
          2.136363636,
        );
      } else {
        await ini.delete("Custom", "Controls", "fIronSightsFOVRotateMult");
        await ini.delete("Custom", "MAIN", "fIronSightsFOVRotateMult");
      }
    },
    defaultValue,
  );
}
