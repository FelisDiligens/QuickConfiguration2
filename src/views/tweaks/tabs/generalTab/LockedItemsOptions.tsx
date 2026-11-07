import PreferencesGroup from "@/components/common/PreferencesGroup";
import SwitchRow from "@/components/common/SwitchRow";
import useItemLockSettingAllowStashTransfer from "@/hooks/tweaks/interface/useItemLockSettingAllowStashTransfer";
import useTransferLockSettingAllowConsumableUse from "@/hooks/tweaks/interface/useTransferLockSettingAllowConsumableUse";
import useTransferLockSettingAllowCraftingUse from "@/hooks/tweaks/interface/useTransferLockSettingAllowCraftingUse";
import { useTranslation } from "react-i18next";

export default function LockedItemsOptions() {
  const { t } = useTranslation();

  const [allowLockedConsumableUse, setAllowLockedConsumableUse] =
    useTransferLockSettingAllowConsumableUse();
  const [allowLockedMaterialsUse, setAllowLockedMaterialsUse] =
    useTransferLockSettingAllowCraftingUse();
  const [allowLockedStashTransfers, setAllowLockedStashTransfers] =
    useItemLockSettingAllowStashTransfer();

  return (
    <PreferencesGroup title={t("tweaks.general.lockedItemsGroup")}>
      <SwitchRow
        title={t("tweaks.general.allowLockedConsumableUse")}
        subtitle={t("tweaks.general.allowLockedConsumableUseSubtitle")}
        checked={allowLockedConsumableUse}
        onChange={setAllowLockedConsumableUse}
      />
      <SwitchRow
        title={t("tweaks.general.allowLockedMaterialsUse")}
        subtitle={t("tweaks.general.allowLockedMaterialsUseSubtitle")}
        checked={allowLockedMaterialsUse}
        onChange={setAllowLockedMaterialsUse}
      />
      <SwitchRow
        title={t("tweaks.general.allowLockedStashTransfers")}
        subtitle={t("tweaks.general.allowLockedStashTransfersSubtitle")}
        checked={allowLockedStashTransfers}
        onChange={setAllowLockedStashTransfers}
      />
    </PreferencesGroup>
  );
}
