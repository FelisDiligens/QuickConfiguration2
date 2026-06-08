import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useAudioMenuVal(keySuffix: string) {
  return useTweak<number>(
    () =>
      ini.findFloatWithDefault(
        ["Custom", "Prefs"],
        "AudioMenu",
        `fVal${keySuffix}`,
        1.0,
      ),
    async (value) => {
      await ini.setFloat("Prefs", "AudioMenu", `fVal${keySuffix}`, value);
      await ini.setFloatIfPresent(
        "Custom",
        "AudioMenu",
        `fVal${keySuffix}`,
        value,
      );
    },
    1.0,
  );
}
