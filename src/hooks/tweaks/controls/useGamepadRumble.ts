import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useGamepadRumble() {
  const defaultValue = true;
  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "Controls",
        "bGamePadRumble",
        defaultValue,
      ),
    (value) => ini.setBoolean("Custom", "Controls", "bGamePadRumble", value),
    defaultValue,
  );
}
