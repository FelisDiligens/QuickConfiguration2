import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useEnableAudio() {
  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "Audio",
        "bEnableAudio",
        true,
      ),
    (value) => ini.setBoolean("Custom", "Audio", "bEnableAudio", value),
    true,
  );
}
