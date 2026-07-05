import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useTransferLockSettingAllowCraftingUse() {
  const defaultValue = false;

  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "MAIN",
        "bTransferLockSettingAllowCraftingUse",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean(
        "Prefs",
        "MAIN",
        "bTransferLockSettingAllowCraftingUse",
        value,
      );
      await ini.setBooleanIfPresent(
        "Custom",
        "MAIN",
        "bTransferLockSettingAllowCraftingUse",
        value,
      );
    },
    defaultValue,
  );
}
