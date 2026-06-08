import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useMouseInvert(axis: "X" | "Y") {
  const defaultValue = false;
  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "Controls",
        `bInvert${axis}Values`,
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean("Prefs", "Controls", `bInvert${axis}Values`, value);
      await ini.setBooleanIfPresent(
        "Custom",
        "Controls",
        `bInvert${axis}Values`,
        value,
      );
    },
    defaultValue,
  );
}
