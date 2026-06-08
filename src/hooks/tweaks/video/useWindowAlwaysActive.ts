import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useWindowAlwaysActive() {
  const defaultValue = true;
  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "Interface",
        "bAlwaysActive",
        defaultValue,
      ),
    (value) => ini.setBoolean("Custom", "Interface", "bAlwaysActive", value),
    defaultValue,
  );
}
