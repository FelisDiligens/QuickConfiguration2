import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useApplyCameraNodeAnimations() {
  const defaultValue = true;

  return useTweak<boolean>(
    async () =>
      await ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "Camera",
        "bApplyCameraNodeAnimations",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean(
        "Prefs",
        "Camera",
        "bApplyCameraNodeAnimations",
        value,
      );
      await ini.setBooleanIfPresent(
        "Custom",
        "Camera",
        "bApplyCameraNodeAnimations",
        value,
      );
    },
    defaultValue,
  );
}
