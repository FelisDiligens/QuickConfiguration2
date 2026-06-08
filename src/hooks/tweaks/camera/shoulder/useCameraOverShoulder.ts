import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

/**
   ```ini
    [Camera]
    fOverShoulderCombatAddY
    fOverShoulderCombatPosX
    fOverShoulderCombatPosZ
    fOverShoulderMeleeCombatAddY
    fOverShoulderMeleeCombatPosX
    fOverShoulderMeleeCombatPosZ
    fOverShoulderPosX
    fOverShoulderPosZ
    ```
*/
export default function useCameraOverShoulder(
  kind: "" | "Combat" | "MeleeCombat",
  axis: "AddY" | "PosX" | "PosZ",
) {
  const defaultValue = 0;
  const key = `fOverShoulder${kind}${axis}`;

  return useTweak<number>(
    () =>
      ini.findFloatWithDefault(
        ["Custom", "Prefs"],
        "Camera",
        key,
        defaultValue,
      ),
    async (value) => {
      if (value == defaultValue) {
        await ini.delete("Custom", "Camera", key);
      } else {
        await ini.setFloat("Custom", "Camera", key, value);
      }
    },
    defaultValue,
  );
}
