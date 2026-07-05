import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useTransferLockSettingAllowConsumableUse() {
  const defaultValue = false;

  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "MAIN",
        "bTransferLockSettingAllowConsumableUse",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean(
        "Prefs",
        "MAIN",
        "bTransferLockSettingAllowConsumableUse",
        value,
      );
      await ini.setBooleanIfPresent(
        "Custom",
        "MAIN",
        "bTransferLockSettingAllowConsumableUse",
        value,
      );
    },
    defaultValue,
  );
}
