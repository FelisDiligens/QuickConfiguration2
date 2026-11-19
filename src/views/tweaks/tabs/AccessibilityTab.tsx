import {
  ColorPickerRow,
  ComboRow,
  PreferencesGroup,
  SliderRow,
  SwitchRow,
} from "@/components/common";
import {
  ScreenNarrationVoiceType,
  useAlternativeNoteViewBackgroundColor as useAlternativeNodeViewBackgroundColor,
  useAlternativeNoteViewLargeText,
  useAlternativeNoteViewTextColor as useAlternativeNodeViewTextColor,
  useMessageWindowFadeAmount,
  useMessageWindowFadeTime,
  useScreenNarrationEnabled,
  useScreenNarrationVoiceType,
  useShowAccessibilityScreenOnStart,
  useSingleButtonNotificationCancel,
  useSpeechToText,
} from "@/hooks/tweaks/accessibility";
import useDebouncedState from "@/hooks/useDebouncedState";
import { useTranslation } from "react-i18next";

export default function AccessibilityTab() {
  const { t } = useTranslation();

  const [speechToText, setSpeechToText] = useSpeechToText();
  const [messageWindowFadeTime, setMessageWindowFadeTime] =
    useMessageWindowFadeTime();
  const [messageWindowFadeAmount, setMessageWindowFadeAmount] =
    useMessageWindowFadeAmount();
  const [singleButtonNotificationCancel, setSingleButtonNotificationCancel] =
    useSingleButtonNotificationCancel();
  const [screenNarration, setScreenNarration] = useScreenNarrationEnabled();
  const [screenNarrationVoiceType, setScreenNarrationVoiceType] =
    useScreenNarrationVoiceType();
  const [showAccessibilityScreenOnStart, setShowAccessibilityScreenOnStart] =
    useShowAccessibilityScreenOnStart();

  const [altNoteViewLargeText, setAltNoteViewLargeText] =
    useAlternativeNoteViewLargeText();
  const [
    altNoteViewTextColor,
    setAltNoteViewTextColor,
    altNoteViewDefaultTextColor,
  ] = useAlternativeNodeViewTextColor();
  const [altNoteViewTextColorDebounced, setAltNoteViewTextColorDebounced] =
    useDebouncedState(altNoteViewTextColor, setAltNoteViewTextColor, 1000);
  const [
    altNoteViewBackgroundColor,
    setAltNoteViewBackgroundColor,
    altNoteViewDefaultBackgroundColor,
  ] = useAlternativeNodeViewBackgroundColor();
  const [
    altNoteViewBackgroundColorDebounced,
    setAltNoteViewBackgroundColorDebounced,
  ] = useDebouncedState(
    altNoteViewBackgroundColor,
    setAltNoteViewBackgroundColor,
    1000,
  );

  return (
    <>
      <PreferencesGroup title={t("tweaks.accessibility.title")}>
        <SwitchRow
          title={t("tweaks.accessibility.enableSpeechToText")}
          checked={speechToText}
          onChange={setSpeechToText}
        />
        <SliderRow
          title={t("tweaks.accessibility.messageWindowFadeTime")}
          subtitle={t("tweaks.accessibility.messageWindowFadeTimeSubtitle")}
          value={messageWindowFadeTime}
          min={1}
          max={10}
          step={1}
          onChange={setMessageWindowFadeTime}
        />
        <SliderRow
          title={t("tweaks.accessibility.messageWindowFadeAmount")}
          subtitle={t("tweaks.accessibility.messageWindowFadeAmountSubtitle")}
          value={messageWindowFadeAmount}
          min={1}
          max={10}
          step={1}
          onChange={setMessageWindowFadeAmount}
        />
        <SwitchRow
          title={t("tweaks.accessibility.singleButtonNotificationCancel")}
          checked={singleButtonNotificationCancel}
          onChange={setSingleButtonNotificationCancel}
        />
        <SwitchRow
          title={t("tweaks.accessibility.enableScreenNarration")}
          checked={screenNarration}
          onChange={setScreenNarration}
        />
        <ComboRow
          title={t("tweaks.accessibility.screenNarrationVoice")}
          value={screenNarrationVoiceType.toString()}
          onChange={(value) => setScreenNarrationVoiceType(parseInt(value))}
        >
          <option value={ScreenNarrationVoiceType.VoiceType1}>
            {t("tweaks.accessibility.screenNarrationVoiceType", { num: 1 })}
          </option>
          <option value={ScreenNarrationVoiceType.VoiceType2}>
            {t("tweaks.accessibility.screenNarrationVoiceType", { num: 2 })}
          </option>
        </ComboRow>
        <SwitchRow
          title={t("tweaks.accessibility.showAccessibilityScreenOnStart")}
          checked={showAccessibilityScreenOnStart}
          onChange={setShowAccessibilityScreenOnStart}
        />
      </PreferencesGroup>

      <PreferencesGroup
        title={t("tweaks.accessibility.alternativeNoteView")}
        subtitle={t("tweaks.accessibility.alternativeNoteViewSubtitle")}
      >
        <SwitchRow
          title={t("tweaks.accessibility.altNoteViewLargeText")}
          checked={altNoteViewLargeText}
          onChange={setAltNoteViewLargeText}
        />
        <ColorPickerRow
          title={t("tweaks.accessibility.altNoteViewTextColor")}
          value={altNoteViewTextColorDebounced}
          defaultValue={altNoteViewDefaultTextColor}
          onChange={setAltNoteViewTextColorDebounced}
        />
        <ColorPickerRow
          title={t("tweaks.accessibility.altNoteViewBackgroundColor")}
          value={altNoteViewBackgroundColorDebounced}
          defaultValue={altNoteViewDefaultBackgroundColor}
          onChange={setAltNoteViewBackgroundColorDebounced}
        />
      </PreferencesGroup>
    </>
  );
}
