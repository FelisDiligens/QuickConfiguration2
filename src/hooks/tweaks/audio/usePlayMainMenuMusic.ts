import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function usePlayMainMenuMusic() {
  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "General",
        "bPlayMainMenuMusic",
        true,
      ),
    (value) => ini.setBoolean("Custom", "General", "bPlayMainMenuMusic", value),
    true,
  );
}
