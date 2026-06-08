import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useVoicePushToTalkEnabled() {
  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "Voice",
        "bVoicePushToTalkEnabled",
        true,
      ),
    async (value) => {
      await ini.setBoolean("Prefs", "Voice", "bVoicePushToTalkEnabled", value);
      await ini.setBooleanIfPresent(
        "Custom",
        "Voice",
        "bVoicePushToTalkEnabled",
        value,
      );
    },
    true,
  );
}
