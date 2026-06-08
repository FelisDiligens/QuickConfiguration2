import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function usePlayIntroVideo() {
  const defaultValue = true;
  return useTweak<boolean>(
    async () => {
      const sIntroSequence = (
        await ini.getStringWithDefault(
          "Custom",
          "General",
          "sIntroSequence",
          "BGSLogo4k.bk2",
        )
      ).trim();
      return sIntroSequence.length > 0 && sIntroSequence !== "0";
    },
    async (value) => {
      if (value) {
        await ini.delete("Custom", "General", "sIntroSequence");
        await ini.delete("Custom", "General", "uMainMenuDelayBeforeAllowSkip");
      } else {
        await ini.setString("Custom", "General", "sIntroSequence", "");
        await ini.setString(
          "Custom",
          "General",
          "uMainMenuDelayBeforeAllowSkip",
          "0",
        );
      }
    },
    defaultValue,
  );
}
