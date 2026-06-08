import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useAdvancedModDescriptions() {
  const defaultValue = true;

  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "MAIN",
        "bAdvancedModDescriptions",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean("Prefs", "MAIN", "bAdvancedModDescriptions", value);
      await ini.setBooleanIfPresent(
        "Custom",
        "MAIN",
        "bAdvancedModDescriptions",
        value,
      );
    },
    defaultValue,
  );
}
