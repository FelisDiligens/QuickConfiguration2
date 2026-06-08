import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";
import { approxEq } from "@/utils/math";

/*
 * There seems to be additional values for 21:9?
 * [Interface] fUIPowerArmorGeometry_TranslateX
 * [Interface] fUIPowerArmorGeometry_TranslateX21x9
 * [Interface] fUIPowerArmorGeometry_TranslateY
 * [Interface] fUIPowerArmorGeometry_TranslateY21x9
 * [Interface] fUIPowerArmorGeometry_TranslateZ
 * [Interface] fUIPowerArmorGeometry_TranslateZ21x9
 * [Interface] fLockPositionY
 * [Interface] fLockPositionYWide
 */
export default function useFixHUD4to3Ratio() {
  const defaultValue = false;

  return useTweak<boolean>(
    async () => {
      const fLockPositionY = await ini.findFloatWithDefault(
        ["Custom", "Prefs"],
        "Interface",
        "fLockPositionY",
        0.0,
      );
      const fUIPowerArmorGeometry_TranslateZ = await ini.findFloatWithDefault(
        ["Custom", "Prefs"],
        "Interface",
        "fUIPowerArmorGeometry_TranslateZ",
        0.0,
      );
      const fUIPowerArmorGeometry_TranslateY = await ini.findFloatWithDefault(
        ["Custom", "Prefs"],
        "Interface",
        "fUIPowerArmorGeometry_TranslateY",
        0.0,
      );

      // Check if they are approximately equal to the target values:
      return (
        approxEq(fLockPositionY, 100.0) &&
        approxEq(fUIPowerArmorGeometry_TranslateZ, -18.5) &&
        approxEq(fUIPowerArmorGeometry_TranslateY, 460.0)
      );
    },
    async (value) => {
      if (value) {
        await ini.setFloat("Custom", "Interface", "fLockPositionY", 100.0);
        await ini.setFloat(
          "Custom",
          "Interface",
          "fUIPowerArmorGeometry_TranslateZ",
          -18.5,
        );
        await ini.setFloat(
          "Custom",
          "Interface",
          "fUIPowerArmorGeometry_TranslateY",
          460.0,
        );
      } else {
        await ini.delete("Custom", "Interface", "fLockPositionY");
        await ini.delete(
          "Custom",
          "Interface",
          "fUIPowerArmorGeometry_TranslateZ",
        );
        await ini.delete(
          "Custom",
          "Interface",
          "fUIPowerArmorGeometry_TranslateY",
        );
      }
    },
    defaultValue,
  );
}
