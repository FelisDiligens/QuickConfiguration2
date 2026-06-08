import ComboRow from "@/components/common/ComboRow";
import PreferencesGroup from "@/components/common/PreferencesGroup";
import SliderRow from "@/components/common/SliderRow";
import SwitchRow from "@/components/common/SwitchRow";
import useAskOpenPerkCardPacks from "@/hooks/tweaks/general/useAskOpenPerkCardPacks";
import useFasterFadeIn from "@/hooks/tweaks/general/useFasterFadeIn";
import usePlayIntroVideo from "@/hooks/tweaks/general/usePlayIntroVideo";
import useQuickHealStimpakPriority, {
  QuickHealStimpakPriority,
} from "@/hooks/tweaks/general/useQuickHealStimpakPriority";
import useRejectSharedPerksEnabled from "@/hooks/tweaks/general/useRejectSharedPerksEnabled";
import useSkipStartupSplash from "@/hooks/tweaks/general/useSkipStartupSplash";
import useVATSGrenadeMineTargetingMode, {
  VATSGrenadeMineTargetingMode,
} from "@/hooks/tweaks/general/useVATSGrenadeMineTargetingMode";
import useShowBackpack from "@/hooks/tweaks/graphics/useShowBackpack";
import useShowOtherPlayersPings from "@/hooks/tweaks/interface/ShowOtherPlayersPings";
import useActiveEffectsOnHUD, {
  ActiveEffectsOnHUD,
} from "@/hooks/tweaks/interface/useActiveEffectsOnHUD";
import useAdvancedModDescriptions from "@/hooks/tweaks/interface/useAdvancedModDescriptions";
import useAutoScrollPipboyItemStats from "@/hooks/tweaks/interface/useAutoScrollPipboyItemStats";
import useAutoTrackQuestWhenStarted from "@/hooks/tweaks/interface/useAutoTrackQuestWhenStarted";
import useConversationHistorySize from "@/hooks/tweaks/interface/useConversationHistorySize";
import useCorpseHighlighting, {
  CorpseHighlighting,
} from "@/hooks/tweaks/interface/useCorpseHighlighting";
import useDialogueSubtitles from "@/hooks/tweaks/interface/useDialogueSubtitles";
import useEnablePowerArmorHUD from "@/hooks/tweaks/interface/useEnablePowerArmorHUD";
import useEnableQuestTrackNotification from "@/hooks/tweaks/interface/useEnableQuestTrackNotification";
import useFloatingQuestMarkersDistance from "@/hooks/tweaks/interface/useFloatingQuestMarkersDistance";
import useGeneralSubtitles from "@/hooks/tweaks/interface/useGeneralSubtitles";
import useHUDOpacity from "@/hooks/tweaks/interface/useHUDOpacity";
import useShowCAMPWeather from "@/hooks/tweaks/interface/useShowCAMPWeather";
import useShowCompass from "@/hooks/tweaks/interface/useShowCompass";
import useShowCrosshair from "@/hooks/tweaks/interface/useShowCrosshair";
import useShowDamageNumbersAdventure from "@/hooks/tweaks/interface/useShowDamageNumbersAdventure";
import useShowDialogueHistory from "@/hooks/tweaks/interface/useShowDialogueHistory";
import useShowFloatingQuestMarkers from "@/hooks/tweaks/interface/useShowFloatingQuestMarkers";
import useShowFloatingQuestText from "@/hooks/tweaks/interface/useShowFloatingQuestText";
import useShowOtherPlayersNames from "@/hooks/tweaks/interface/useShowOtherPlayersNames";
import useShowPublicTeamNotifications from "@/hooks/tweaks/interface/useShowPublicTeamNotifications";
import { useTranslation } from "react-i18next";

export default function GeneralTab() {
  const { t } = useTranslation();

  // Loading:
  const [playIntroVideo, setPlayIntroVideo] = usePlayIntroVideo();
  const [skipStartupSplash, setSkipStartupSplash] = useSkipStartupSplash();
  const [fasterFadeIn, setFasterFadeIn] = useFasterFadeIn();

  // Gameplay:
  const [corpseHighlighting, setCorpseHighlighting] = useCorpseHighlighting();
  const [showBackpack, setShowBackpack] = useShowBackpack();
  const [rejectSharedPerksEnabled, setRejectSharedPerksEnabled] =
    useRejectSharedPerksEnabled();
  const [vatsGrenadeMineTargetingMode, setVATSGrenadeMineTargetingMode] =
    useVATSGrenadeMineTargetingMode();
  const [askOpenPerkCardPacks, setAskOpenPerkCardPacks] =
    useAskOpenPerkCardPacks();
  const [quickHealStimpakPriority, setQuickHealStimpakPriority] =
    useQuickHealStimpakPriority();

  // Dialog:
  const [generalSubtitles, setGeneralSubtitles] = useGeneralSubtitles();
  const [dialogueSubtitles, setDialogueSubtitles] = useDialogueSubtitles();
  const [showDialogueHistory, setShowDialogueHistory] =
    useShowDialogueHistory();
  const [historySize, setHistorySize] = useConversationHistorySize();

  // HUD:
  const [hudOpacity, setHUDOpacity] = useHUDOpacity();
  const [activeEffectsOnHUD, setActiveEffectsOnHUD] = useActiveEffectsOnHUD();
  const [showCrosshair, setShowCrosshair] = useShowCrosshair();
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

  // Floating quest markers:
  const [floatingQuestMarkersDistance, setFloatingQuestMarkersDistance] =
    useFloatingQuestMarkersDistance();
  const [showFloatingQuestMarkers, setShowFloatingQuestMarkers] =
    useShowFloatingQuestMarkers();
  const [showFloatingQuestText, setShowFloatingQuestText] =
    useShowFloatingQuestText();

  // Quests:
  const [enableQuestTrackNotification, setEnableQuestTrackNotification] =
    useEnableQuestTrackNotification();
  const [autoTrackMainQuest, setAutoTrackMainQuest] =
    useAutoTrackQuestWhenStarted("Main");
  const [autoTrackSideQuest, setAutoTrackSideQuest] =
    useAutoTrackQuestWhenStarted("Side");
  const [autoTrackMiscQuest, setAutoTrackMiscQuest] =
    useAutoTrackQuestWhenStarted("Misc"); // Miscellaneous
  const [autoTrackEventQuest, setAutoTrackEventQuest] =
    useAutoTrackQuestWhenStarted("Event");
  const [autoTrackDailyQuest, setAutoTrackDailyQuest] =
    useAutoTrackQuestWhenStarted("Other"); // Other = Daily

  return (
    <>
      <PreferencesGroup title={t("tweaks.general.loadingGroup")}>
        <SwitchRow
          title={t("tweaks.general.skipIntroVideos")}
          checked={!playIntroVideo}
          onChange={(value) => setPlayIntroVideo(!value)}
        />
        <SwitchRow
          title={t("tweaks.general.skipStartupSplash")}
          subtitle={t("tweaks.general.skipStartupSplashSubtitle")}
          checked={skipStartupSplash}
          onChange={setSkipStartupSplash}
        />
        <SwitchRow
          title={t("tweaks.general.fasterFadeIn")}
          subtitle={t("tweaks.general.fasterFadeInSubtitle")}
          checked={fasterFadeIn}
          onChange={setFasterFadeIn}
        />
      </PreferencesGroup>

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
            {t(
              "tweaks.general.quickHealStimpakPriorityOptions.useWeakestFirst",
            )}
          </option>
          <option value={QuickHealStimpakPriority.UseStrongestFirst}>
            {t(
              "tweaks.general.quickHealStimpakPriorityOptions.useStrongestFirst",
            )}
          </option>
        </ComboRow>
      </PreferencesGroup>

      <PreferencesGroup title={t("tweaks.general.dialogueGroup")}>
        <SwitchRow
          title={t("tweaks.general.showGeneralSubtitles")}
          checked={generalSubtitles}
          onChange={setGeneralSubtitles}
        />
        <SwitchRow
          title={t("tweaks.general.showDialogueSubtitles")}
          checked={dialogueSubtitles}
          onChange={setDialogueSubtitles}
        />
        <SwitchRow
          title={t("tweaks.general.showDialogueHistory")}
          checked={showDialogueHistory}
          onChange={setShowDialogueHistory}
        />
        <SliderRow
          title={t("tweaks.general.historySize")}
          subtitle={t("tweaks.general.historySizeSubtitle")}
          value={historySize}
          min={1}
          max={8}
          step={1}
          onChange={setHistorySize}
        />
      </PreferencesGroup>

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

      <PreferencesGroup title={t("tweaks.general.questsGroup")}>
        <SwitchRow
          title={t("tweaks.general.enableQuestTrackNotification")}
          checked={enableQuestTrackNotification}
          onChange={setEnableQuestTrackNotification}
        />
        <SwitchRow
          title={t("tweaks.general.autoTrackMainQuest")}
          checked={autoTrackMainQuest}
          onChange={setAutoTrackMainQuest}
        />
        <SwitchRow
          title={t("tweaks.general.autoTrackSideQuest")}
          checked={autoTrackSideQuest}
          onChange={setAutoTrackSideQuest}
        />
        <SwitchRow
          title={t("tweaks.general.autoTrackMiscQuest")}
          checked={autoTrackMiscQuest}
          onChange={setAutoTrackMiscQuest}
        />
        <SwitchRow
          title={t("tweaks.general.autoTrackEventQuest")}
          checked={autoTrackEventQuest}
          onChange={setAutoTrackEventQuest}
        />
        <SwitchRow
          title={t("tweaks.general.autoTrackDailyQuest")}
          checked={autoTrackDailyQuest}
          onChange={setAutoTrackDailyQuest}
        />
      </PreferencesGroup>
    </>
  );
}
