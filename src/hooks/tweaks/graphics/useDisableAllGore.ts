import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useDisableAllGore() {
  const defaultValue = false;

  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "General",
        "bDisableAllGore",
        defaultValue,
      ),
    async (value) => {
      if (value) {
        await ini.setBoolean("Custom", "General", "bDisableAllGore", true);
      } else {
        // Remove entry when set to it's default value
        await ini.delete("Custom", "General", "bDisableAllGore");
      }
    },
    defaultValue,
  );
}
