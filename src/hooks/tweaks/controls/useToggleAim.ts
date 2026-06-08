import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useToggleAim() {
  const defaultValue = false;
  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "Controls",
        "bToggleAim",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean("Prefs", "Controls", "bToggleAim", value);
      await ini.setBooleanIfPresent("Custom", "Controls", "bToggleAim", value);
    },
    defaultValue,
  );
}
