import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

type KeySuffix = "Main" | "Side" | "Misc" | "Event" | "Other";

export default function useAutoTrackQuestWhenStarted(keySuffix: KeySuffix) {
  const defaultValue = keySuffix === "Main" || keySuffix === "Event";

  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "MAIN",
        `bEnableQuestAutoTrack${keySuffix}`,
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean(
        "Prefs",
        "MAIN",
        `bEnableQuestAutoTrack${keySuffix}`,
        value,
      );
      await ini.setBooleanIfPresent(
        "Custom",
        "MAIN",
        `bEnableQuestAutoTrack${keySuffix}`,
        value,
      );
    },
    defaultValue,
  );
}
