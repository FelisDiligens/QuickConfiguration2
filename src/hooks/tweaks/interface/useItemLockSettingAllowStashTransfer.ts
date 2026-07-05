import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useItemLockSettingAllowStashTransfer() {
  const defaultValue = false;

  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "MAIN",
        "bItemLockSettingAllowStashTransfer",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean(
        "Prefs",
        "MAIN",
        "bItemLockSettingAllowStashTransfer",
        value,
      );
      await ini.setBooleanIfPresent(
        "Custom",
        "MAIN",
        "bItemLockSettingAllowStashTransfer",
        value,
      );
    },
    defaultValue,
  );
}
