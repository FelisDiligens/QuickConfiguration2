import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useVivoxVoiceVolume() {
  return useTweak<number>(
    () =>
      ini.findIntWithDefault(
        ["Custom", "Prefs"],
        "Voice",
        "uVivoxVoiceVolume",
        100,
      ),
    async (value) => {
      await ini.setInt("Prefs", "Voice", "uVivoxVoiceVolume", value);
      await ini.setIntIfPresent("Custom", "Voice", "uVivoxVoiceVolume", value);
    },
    100,
  );
}
