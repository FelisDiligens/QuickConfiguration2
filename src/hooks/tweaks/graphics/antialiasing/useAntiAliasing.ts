import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export enum AntiAliasing {
  TAA = "TAA",
  Disabled = "0",
}

export default function useAntiAliasing() {
  const defaultValue = AntiAliasing.TAA;
  return useTweak<AntiAliasing>(
    async () => {
      const aaString = await ini.findStringWithDefault(
        ["Custom", "Prefs"],
        "Display",
        "sAntiAliasing",
        defaultValue.toString(),
      );

      switch (aaString.toUpperCase()) {
        case "TAA":
          return AntiAliasing.TAA;
        case "FXAA":
        case "Disabled":
        case "0":
        case "":
          return AntiAliasing.Disabled;
        default:
          return defaultValue;
      }
    },
    async (value) => {
      switch (value) {
        case AntiAliasing.TAA:
          await ini.setString("Prefs", "Display", "sAntiAliasing", "TAA");
          await ini.setStringIfPresent(
            "Custom",
            "Display",
            "sAntiAliasing",
            "TAA",
          );
          break;
        case AntiAliasing.Disabled:
          await ini.setString("Prefs", "Display", "sAntiAliasing", "");
          await ini.setStringIfPresent(
            "Custom",
            "Display",
            "sAntiAliasing",
            "",
          );
          break;
        default:
          await ini.setString("Prefs", "Display", "sAntiAliasing", "TAA");
          await ini.setStringIfPresent(
            "Custom",
            "Display",
            "sAntiAliasing",
            "TAA",
          );
          break;
      }
    },
    defaultValue,
  );
}
