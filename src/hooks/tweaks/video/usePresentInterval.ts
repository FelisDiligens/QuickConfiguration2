import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function usePresentInterval() {
  const defaultValue = true;
  return useTweak<boolean>(
    async () => {
      const val = await ini.findIntWithDefault(
        ["Custom", "Prefs"],
        "Display",
        "iPresentInterval",
        defaultValue ? 1 : 0,
      );
      return val > 0;
    },
    async (value) => {
      await ini.setInt("Prefs", "Display", "iPresentInterval", value ? 1 : 0);
      await ini.setIntIfPresent(
        "Custom",
        "Display",
        "iPresentInterval",
        value ? 1 : 0,
      );
    },
    defaultValue,
  );
}
