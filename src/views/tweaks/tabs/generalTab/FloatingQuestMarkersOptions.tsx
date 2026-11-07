import PreferencesGroup from "@/components/common/PreferencesGroup";
import SliderRow from "@/components/common/SliderRow";
import SwitchRow from "@/components/common/SwitchRow";
import useFloatingQuestMarkersDistance from "@/hooks/tweaks/interface/useFloatingQuestMarkersDistance";
import useShowFloatingQuestMarkers from "@/hooks/tweaks/interface/useShowFloatingQuestMarkers";
import useShowFloatingQuestText from "@/hooks/tweaks/interface/useShowFloatingQuestText";
import { useTranslation } from "react-i18next";

export default function FloatingQuestMarkersOptions() {
  const { t } = useTranslation();

  const [floatingQuestMarkersDistance, setFloatingQuestMarkersDistance] =
    useFloatingQuestMarkersDistance();
  const [showFloatingQuestMarkers, setShowFloatingQuestMarkers] =
    useShowFloatingQuestMarkers();
  const [showFloatingQuestText, setShowFloatingQuestText] =
    useShowFloatingQuestText();

  return (
    <PreferencesGroup title={t("tweaks.general.floatingQuestMarkersGroup")}>
      <SliderRow
        title={t("tweaks.general.floatingQuestMarkersDistance")}
        value={floatingQuestMarkersDistance}
        min={20}
        max={100}
        step={5}
        onChange={setFloatingQuestMarkersDistance}
      />
      <SwitchRow
        title={t("tweaks.general.showFloatingQuestMarkers")}
        checked={showFloatingQuestMarkers}
        onChange={setShowFloatingQuestMarkers}
      />
      <SwitchRow
        title={t("tweaks.general.showFloatingQuestText")}
        checked={showFloatingQuestText}
        onChange={setShowFloatingQuestText}
      />
    </PreferencesGroup>
  );
}
