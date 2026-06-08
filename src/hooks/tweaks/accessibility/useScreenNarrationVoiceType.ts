import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";
import { clamp } from "@/utils/math";

export enum ScreenNarrationVoiceType {
  VoiceType1 = 0,
  VoiceType2 = 1,
}

export default function useScreenNarrationVoiceType() {
  const defaultValue = ScreenNarrationVoiceType.VoiceType1;

  return useTweak<ScreenNarrationVoiceType>(
    async () => {
      let value = await ini.findIntWithDefault(
        ["Custom", "Prefs"],
        "Accessibility",
        "uiScreenNarrationVoice",
        defaultValue,
      );
      value = clamp(value, 0, 1);
      return value as ScreenNarrationVoiceType;
    },
    async (value) => {
      await ini.setInt(
        "Prefs",
        "Accessibility",
        "uiScreenNarrationVoice",
        value,
      );
      await ini.setIntIfPresent(
        "Custom",
        "Accessibility",
        "uiScreenNarrationVoice",
        value,
      );
    },
    defaultValue,
  );
}
