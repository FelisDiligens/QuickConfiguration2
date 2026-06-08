import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useDepthOfFieldEnabled() {
  const defaultValue = true;

  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "ImageSpace",
        "bDynamicDepthOfField",
        defaultValue,
      ),
    async (value) => {
      if (value) {
        // If enabling, remove all associated keys
        await ini.delete("Custom", "ImageSpace", "bDynamicDepthOfField");
        await ini.delete("Custom", "Display", "fDOFBlendRatio");
        await ini.delete("Custom", "Display", "fDOFMinFocalCoefDist");
        await ini.delete("Custom", "Display", "fDOFMaxFocalCoefDist");
        await ini.delete("Custom", "Display", "fDOFDynamicFarRange");
        await ini.delete("Custom", "Display", "fDOFCenterWeightInt");
        await ini.delete("Custom", "Display", "fDOFFarDistance");
      } else {
        // If disabling, set specific values
        await ini.setBoolean(
          "Custom",
          "ImageSpace",
          "bDynamicDepthOfField",
          false,
        );
        await ini.setFloat("Custom", "Display", "fDOFBlendRatio", 0);
        await ini.setFloat("Custom", "Display", "fDOFMinFocalCoefDist", 999999);
        await ini.setFloat(
          "Custom",
          "Display",
          "fDOFMaxFocalCoefDist",
          99999999,
        );
        await ini.setFloat(
          "Custom",
          "Display",
          "fDOFDynamicFarRange",
          99999999,
        );
        await ini.setFloat("Custom", "Display", "fDOFCenterWeightInt", 0);
        await ini.setFloat("Custom", "Display", "fDOFFarDistance", 99999999);
      }
    },
    defaultValue,
  );
}
