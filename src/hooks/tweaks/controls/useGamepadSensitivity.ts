import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

interface GamepadSensitivity {
  x: number;
  y: number;
}

export default function useGamepadSensitivity() {
  const defaultValue: GamepadSensitivity = { x: 0.6667, y: 0.6 };
  return useTweak<GamepadSensitivity>(
    async () => {
      const x = await ini.findFloatWithDefault(
        ["Custom", "Prefs"],
        "Controls",
        "fGamepadHeadingSensitivity",
        defaultValue.x,
      );
      const y = await ini.findFloatWithDefault(
        ["Custom", "Prefs"],
        "Controls",
        "fGamepadHeadingSensitivityY",
        defaultValue.y,
      );
      return { x, y };
    },
    async (value) => {
      await ini.setFloat(
        "Prefs",
        "Controls",
        "fGamepadHeadingSensitivity",
        value.x,
      );
      await ini.setFloatIfPresent(
        "Custom",
        "Controls",
        "fGamepadHeadingSensitivity",
        value.x,
      );
      await ini.setFloat(
        "Prefs",
        "Controls",
        "fGamepadHeadingSensitivityY",
        value.y,
      );
      await ini.setFloatIfPresent(
        "Custom",
        "Controls",
        "fGamepadHeadingSensitivityY",
        value.y,
      );
    },
    defaultValue,
  );
}
