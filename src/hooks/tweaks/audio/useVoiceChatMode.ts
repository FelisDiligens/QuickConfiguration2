import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export enum VoiceChatMode {
  Auto = 0,
  Area = 1,
  Team = 2,
  None = 3,
}

export default function useVoiceChatMode() {
  return useTweak<VoiceChatMode>(
    () =>
      ini.findIntWithDefault(
        ["Custom", "Prefs"],
        "Voice",
        "uTransmitPreference",
        VoiceChatMode.Auto,
      ),
    async (value) => {
      await ini.setInt("Prefs", "Voice", "uTransmitPreference", value);
      await ini.setIntIfPresent(
        "Custom",
        "Voice",
        "uTransmitPreference",
        value,
      );
    },
    VoiceChatMode.Auto,
  );
}
