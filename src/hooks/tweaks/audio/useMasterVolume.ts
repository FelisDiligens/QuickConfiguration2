import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useMasterVolume() {
  return useTweak<number>(
    () =>
      ini.findFloatWithDefault(
        ["Custom", "Prefs"],
        "AudioMenu",
        "fAudioMasterVolume",
        1.0,
      ),
    async (value) => {
      await ini.setFloat("Prefs", "AudioMenu", "fAudioMasterVolume", value);
      await ini.setFloatIfPresent(
        "Custom",
        "AudioMenu",
        "fAudioMasterVolume",
        value,
      );
    },
    1.0,
  );
}
