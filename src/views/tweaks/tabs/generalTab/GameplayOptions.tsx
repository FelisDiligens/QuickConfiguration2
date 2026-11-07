import ComboRow from "@/components/common/ComboRow";
import PreferencesGroup from "@/components/common/PreferencesGroup";
import SwitchRow from "@/components/common/SwitchRow";
import useAskOpenPerkCardPacks from "@/hooks/tweaks/general/useAskOpenPerkCardPacks";
import useQuickHealStimpakPriority, {
  QuickHealStimpakPriority,
} from "@/hooks/tweaks/general/useQuickHealStimpakPriority";
import useRejectSharedPerksEnabled from "@/hooks/tweaks/general/useRejectSharedPerksEnabled";
import useShowGrenadeTrajectory from "@/hooks/tweaks/general/useShowGrenadeTrajectory";
import useVATSGrenadeMineTargetingMode, {
  VATSGrenadeMineTargetingMode,
} from "@/hooks/tweaks/general/useVATSGrenadeMineTargetingMode";
import useShowBackpack from "@/hooks/tweaks/graphics/useShowBackpack";
import useCorpseHighlighting, {
  CorpseHighlighting,
} from "@/hooks/tweaks/interface/useCorpseHighlighting";
import { useTranslation } from "react-i18next";

export default function GameplayOptions() {
  const { t } = useTranslation();

  const [corpseHighlighting, setCorpseHighlighting] = useCorpseHighlighting();
  const [showBackpack, setShowBackpack] = useShowBackpack();
  const [showGrenadeTrajectory, setShowGrenadeTrajectory] =
    useShowGrenadeTrajectory();
  const [rejectSharedPerksEnabled, setRejectSharedPerksEnabled] =
    useRejectSharedPerksEnabled();
  const [vatsGrenadeMineTargetingMode, setVATSGrenadeMineTargetingMode] =
    useVATSGrenadeMineTargetingMode();
  const [askOpenPerkCardPacks, setAskOpenPerkCardPacks] =
    useAskOpenPerkCardPacks();
  const [quickHealStimpakPriority, setQuickHealStimpakPriority] =
    useQuickHealStimpakPriority();

  return (
    <PreferencesGroup title={t("tweaks.general.gameplayGroup")}>
      <ComboRow
        title={t("tweaks.general.corpseHighlighting")}
        subtitle={t("tweaks.general.corpseHighlightingSubtitle")}
        value={corpseHighlighting.toString()}
        onChange={(value) => setCorpseHighlighting(parseInt(value))}
      >
        <option value={CorpseHighlighting.Disabled}>
          {t("tweaks.general.corpseHighlightingOptions.disabled")}
        </option>
        <option value={CorpseHighlighting.ClearOnInspect}>
          {t("tweaks.general.corpseHighlightingOptions.clearOnInspect")}
        </option>
        <option value={CorpseHighlighting.ClearOnRemove}>
          {t("tweaks.general.corpseHighlightingOptions.clearOnRemove")}
        </option>
      </ComboRow>
      <SwitchRow
        title={t("tweaks.general.showBackpack")}
        checked={showBackpack}
        onChange={setShowBackpack}
      />
      <SwitchRow
        title={t("tweaks.general.showThrowingArc")}
        subtitle={t("tweaks.general.showThrowingArcSubtitle")}
        checked={showGrenadeTrajectory}
        onChange={setShowGrenadeTrajectory}
      />
      <SwitchRow
        title={t("tweaks.general.rejectSharedPerks")}
        checked={rejectSharedPerksEnabled}
        onChange={setRejectSharedPerksEnabled}
      />
      <ComboRow
        title={t("tweaks.general.vatsGrenadeMineTargetingMode")}
        value={vatsGrenadeMineTargetingMode.toString()}
        onChange={(value) => setVATSGrenadeMineTargetingMode(parseInt(value))}
      >
        <option value={VATSGrenadeMineTargetingMode.None}>
          {t("tweaks.general.vatsGrenadeMineTargetingModeOptions.none")}
        </option>
        <option value={VATSGrenadeMineTargetingMode.OnlyMyOwn}>
          {t("tweaks.general.vatsGrenadeMineTargetingModeOptions.onlyMyOwn")}
        </option>
        <option value={VATSGrenadeMineTargetingMode.All}>
          {t("tweaks.general.vatsGrenadeMineTargetingModeOptions.all")}
        </option>
      </ComboRow>
      <SwitchRow
        title={t("tweaks.general.askOpenPerkCardPacks")}
        checked={askOpenPerkCardPacks}
        onChange={setAskOpenPerkCardPacks}
      />
      <ComboRow
        title={t("tweaks.general.quickHealStimpakPriority")}
        value={quickHealStimpakPriority.toString()}
        onChange={(value) => setQuickHealStimpakPriority(parseInt(value))}
      >
        <option value={QuickHealStimpakPriority.UseWeakestFirst}>
          {t("tweaks.general.quickHealStimpakPriorityOptions.useWeakestFirst")}
        </option>
        <option value={QuickHealStimpakPriority.UseStrongestFirst}>
          {t(
            "tweaks.general.quickHealStimpakPriorityOptions.useStrongestFirst",
          )}
        </option>
      </ComboRow>
    </PreferencesGroup>
  );
}
