import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

// Note: This option cannot be found in the game's strings anymore and ingame, it seems to not do anything.
/** Changes the field of view of the 3rd person perspective while aiming. */
export default function useFOV3rdADS() {
  const defaultValue = 50;
  return useTweak<number>(
    () =>
      ini.findFloatWithDefault(
        ["Custom", "Prefs"],
        "Camera",
        "f3rdPersonAimFOV",
        defaultValue,
      ),
    async (value) => {
      await ini.setFloat("Prefs", "Camera", "f3rdPersonAimFOV", value);
      await ini.setFloatIfPresent(
        "Custom",
        "Camera",
        "f3rdPersonAimFOV",
        value,
      );
    },
    defaultValue,
  );
}
