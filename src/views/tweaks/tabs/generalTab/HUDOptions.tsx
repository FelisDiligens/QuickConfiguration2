import ComboRow from "@/components/common/ComboRow";
import PreferencesGroup from "@/components/common/PreferencesGroup";
import SliderRow from "@/components/common/SliderRow";
import SwitchRow from "@/components/common/SwitchRow";
import useActiveEffectsOnHUD, {
  ActiveEffectsOnHUD,
} from "@/hooks/tweaks/interface/useActiveEffectsOnHUD";
import useAdvancedModDescriptions from "@/hooks/tweaks/interface/useAdvancedModDescriptions";
import useAutoScrollPipboyItemStats from "@/hooks/tweaks/interface/useAutoScrollPipboyItemStats";
import useEnablePowerArmorHUD from "@/hooks/tweaks/interface/useEnablePowerArmorHUD";
import useHUDOpacity from "@/hooks/tweaks/interface/useHUDOpacity";
import useShowCAMPWeather from "@/hooks/tweaks/interface/useShowCAMPWeather";
import useShowCompass from "@/hooks/tweaks/interface/useShowCompass";
import useShowCrosshair from "@/hooks/tweaks/interface/useShowCrosshair";
import useShowDamageNumbersAdventure from "@/hooks/tweaks/interface/useShowDamageNumbersAdventure";
import useShowMapRegionNames from "@/hooks/tweaks/interface/useShowMapRegionNames";
import useShowOtherPlayersNames from "@/hooks/tweaks/interface/useShowOtherPlayersNames";
import useShowPublicTeamNotifications from "@/hooks/tweaks/interface/useShowPublicTeamNotifications";
import useShowOtherPlayersPings from "@/hooks/tweaks/interface/ShowOtherPlayersPings";
import { useTranslation } from "react-i18next";

export default function HUDOptions() {
  const { t } = useTranslation();

  const [hudOpacity, setHUDOpacity] = useHUDOpacity();
  const [activeEffectsOnHUD, setActiveEffectsOnHUD] = useActiveEffectsOnHUD();
  const [showCrosshair, setShowCrosshair] = useShowCrosshair();
  const [showMapRegionNames, setShowMapRegionNames] = useShowMapRegionNames();
  const [enablePowerArmorHUD, setEnablePowerArmorHUD] =
    useEnablePowerArmorHUD();
  const [showPublicTeamNotifications, setShowPublicTeamNotifications] =
    useShowPublicTeamNotifications();
  const [showDamageNumbersAdventure, setShowDamageNumbersAdventure] =
    useShowDamageNumbersAdventure();
  const [showOtherPlayersNames, setShowOtherPlayersNames] =
    useShowOtherPlayersNames();
  const [showOtherPlayersPings, setShowOtherPlayersPings] =
    useShowOtherPlayersPings();
  const [showCompass, setShowCompass] = useShowCompass();
  const [advancedModDescriptions, setAdvancedModDescriptions] =
    useAdvancedModDescriptions();
  const [autoScrollPipboyItemStats, setAutoScrollPipboyItemStats] =
    useAutoScrollPipboyItemStats();
  const [showCAMPWeather, setShowCAMPWeather] = useShowCAMPWeather();

  return (
    <PreferencesGroup title={t("tweaks.general.hudGroup")}>
      <SliderRow
        title={t("tweaks.general.hudOpacity")}
        value={Math.trunc(hudOpacity * 100)}
        min={0}
        max={100}
        step={5}
        onChange={(value) => setHUDOpacity(value / 100)}
      />
      <ComboRow
        title={t("tweaks.general.activeEffectsOnHud")}
        value={activeEffectsOnHUD.toString()}
        onChange={(value) => setActiveEffectsOnHUD(parseInt(value))}
      >
        <option value={ActiveEffectsOnHUD.Disabled}>
          {t("tweaks.general.activeEffectsOnHudOptions.disabled")}
        </option>
        <option value={ActiveEffectsOnHUD.Detrimental}>
          {t("tweaks.general.activeEffectsOnHudOptions.detrimental")}
        </option>
        <option value={ActiveEffectsOnHUD.All}>
          {t("tweaks.general.activeEffectsOnHudOptions.all")}
        </option>
      </ComboRow>
      <SwitchRow
        title={t("tweaks.general.showCrosshair")}
        checked={showCrosshair}
        onChange={setShowCrosshair}
      />
      <SwitchRow
        title={t("tweaks.general.showMapRegionNames")}
        subtitle={t("tweaks.general.showMapRegionNamesSubtitle")}
        checked={showMapRegionNames}
        onChange={setShowMapRegionNames}
      />
      <SwitchRow
        title={t("tweaks.general.enablePowerArmorHud")}
        checked={enablePowerArmorHUD}
        onChange={setEnablePowerArmorHUD}
      />
      <SwitchRow
        title={t("tweaks.general.enablePublicTeamNotifications")}
        checked={showPublicTeamNotifications}
        onChange={setShowPublicTeamNotifications}
      />
      <SwitchRow
        title={t("tweaks.general.showFloatingDamageNumbers")}
        checked={showDamageNumbersAdventure}
        onChange={setShowDamageNumbersAdventure}
      />
      <SwitchRow
        title={t("tweaks.general.showOtherPlayersNames")}
        checked={showOtherPlayersNames}
        onChange={setShowOtherPlayersNames}
      />
      <SwitchRow
        title={t("tweaks.general.showOtherPlayersPings")}
        checked={showOtherPlayersPings}
        onChange={setShowOtherPlayersPings}
      />
      <SwitchRow
        title={t("tweaks.general.showCompass")}
        checked={showCompass}
        onChange={setShowCompass}
      />
      <SwitchRow
        title={t("tweaks.general.advancedModDescriptions")}
        checked={advancedModDescriptions}
        onChange={setAdvancedModDescriptions}
      />
      <SwitchRow
        title={t("tweaks.general.autoScrollPipboyItemStats")}
        checked={autoScrollPipboyItemStats}
        onChange={setAutoScrollPipboyItemStats}
      />
      <SwitchRow
        title={t("tweaks.general.showCAMPWeather")}
        checked={showCAMPWeather}
        onChange={setShowCAMPWeather}
      />
    </PreferencesGroup>
  );
}
