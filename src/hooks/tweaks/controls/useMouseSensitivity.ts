import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

interface MouseSensitivity {
  x: number;
  y: number;
}

export default function useMouseSensitivity() {
  const defaultValue: MouseSensitivity = { x: 0.03, y: 0.03 };
  return useTweak<MouseSensitivity>(
    async () => {
      const x = await ini.findFloatWithDefault(
        ["Custom", "Prefs"],
        "Controls",
        "fMouseHeadingSensitivity",
        defaultValue.x,
      );
      const y = await ini.findFloatWithDefault(
        ["Custom", "Prefs"],
        "Controls",
        "fMouseHeadingSensitivityY",
        defaultValue.y,
      );
      return { x, y };
    },
    async (value) => {
      await ini.setFloat(
        "Prefs",
        "Controls",
        "fMouseHeadingSensitivity",
        value.x,
      );
      await ini.setFloatIfPresent(
        "Custom",
        "Controls",
        "fMouseHeadingSensitivity",
        value.x,
      );
      await ini.setFloat(
        "Prefs",
        "Controls",
        "fMouseHeadingSensitivityY",
        value.y,
      );
      await ini.setFloatIfPresent(
        "Custom",
        "Controls",
        "fMouseHeadingSensitivityY",
        value.y,
      );
    },
    defaultValue,
  );
}
