import ComboRow from "@/components/common/ComboRow";
import PreferencesGroup from "@/components/common/PreferencesGroup";
import SliderRow from "@/components/common/SliderRow";
import SwitchRow from "@/components/common/SwitchRow";
import useAudioMenuVal from "@/hooks/tweaks/audio/useAudioMenuVal";
import useEnableAudio from "@/hooks/tweaks/audio/useEnableAudio";
import useMasterVolume from "@/hooks/tweaks/audio/useMasterVolume";
import usePlayMainMenuMusic from "@/hooks/tweaks/audio/usePlayMainMenuMusic";
import useVivoxVoiceVolume from "@/hooks/tweaks/audio/useVivoxVoiceVolume";
import useVoiceChatMode, {
  VoiceChatMode,
} from "@/hooks/tweaks/audio/useVoiceChatMode";
import useVoicePushToTalkEnabled from "@/hooks/tweaks/audio/useVoicePushToTalkEnabled";
import { useTranslation } from "react-i18next";

function VolumeSliderRow(props: {
  title: string;
  value: number;
  onChange?: (value: number) => void;
  multiplier?: number;
}) {
  const multiplier = props.multiplier || 100; // precentage multiplier, usually a float between 0 and 1 is given.
  return (
    <SliderRow
      title={props.title}
      value={Math.round(props.value * multiplier)}
      min={0}
      max={100}
      step={1}
      onChange={(value) => props.onChange && props.onChange(value / multiplier)}
    />
  );
}

export default function AudioTab() {
  const { t } = useTranslation();

  // Volume
  const [masterVolume, setMasterVolume] = useMasterVolume();
  const [vivoxVoiceVolume, setVivoxVoiceVolume] = useVivoxVoiceVolume();

  const [menuMusicVolume, setMenuMusicVolume] = useAudioMenuVal("0");
  const [worldRadiosVolume, setWorldRadiosVolume] = useAudioMenuVal("1");
  const [voiceVolume, setVoiceVolume] = useAudioMenuVal("2");
  const [musicVolume, setMusicVolume] = useAudioMenuVal("3");
  const [effectsVolume, setEffectsVolume] = useAudioMenuVal("4");
  const [footstepsVolume, setFootstepsVolume] = useAudioMenuVal("5");
  const [pipBoyRadioVolume, setPipBoyRadioVolume] = useAudioMenuVal("6");

  // Audio
  const [enableAudio, setEnableAudio] = useEnableAudio();
  const [playMainMenuMusic, setPlayMainMenuMusic] = usePlayMainMenuMusic();

  // Voice
  const [voiceChatMode, setVoiceChatMode] = useVoiceChatMode();
  const [voicePushToTalkEnabled, setVoicePushToTalkEnabled] =
    useVoicePushToTalkEnabled();

  return (
    <>
      <PreferencesGroup title={t("tweaks.audio.volume")}>
        <VolumeSliderRow
          title={t("tweaks.audio.volumeMaster")}
          value={masterVolume}
          onChange={setMasterVolume}
        />
        <VolumeSliderRow
          title={t("tweaks.audio.volumeChat")}
          value={vivoxVoiceVolume}
          onChange={setVivoxVoiceVolume}
          multiplier={1}
        />
      </PreferencesGroup>
      <PreferencesGroup>
        <VolumeSliderRow
          title={t("tweaks.audio.volumeMenuMusic")}
          value={menuMusicVolume}
          onChange={setMenuMusicVolume}
        />
        <VolumeSliderRow
          title={t("tweaks.audio.volumeWorldRadios")}
          value={worldRadiosVolume}
          onChange={setWorldRadiosVolume}
        />
        <VolumeSliderRow
          title={t("tweaks.audio.volumeVoice")}
          value={voiceVolume}
          onChange={setVoiceVolume}
        />
        <VolumeSliderRow
          title={t("tweaks.audio.volumeMusic")}
          value={musicVolume}
          onChange={setMusicVolume}
        />
        <VolumeSliderRow
          title={t("tweaks.audio.volumeEffects")}
          value={effectsVolume}
          onChange={setEffectsVolume}
        />
        <VolumeSliderRow
          title={t("tweaks.audio.volumeFootsteps")}
          value={footstepsVolume}
          onChange={setFootstepsVolume}
        />
        <VolumeSliderRow
          title={t("tweaks.audio.volumePipboyRadio")}
          value={pipBoyRadioVolume}
          onChange={setPipBoyRadioVolume}
        />
      </PreferencesGroup>

      <PreferencesGroup title={t("tweaks.audio.audio")}>
        <SwitchRow
          title={t("tweaks.audio.enableAudio")}
          checked={enableAudio}
          onChange={(value) => setEnableAudio(value)}
        />
        <SwitchRow
          title={t("tweaks.audio.playMusicInMainMenu")}
          checked={playMainMenuMusic}
          onChange={(value) => setPlayMainMenuMusic(value)}
        />
      </PreferencesGroup>

      <PreferencesGroup title={t("tweaks.audio.voice")}>
        <ComboRow
          title={t("tweaks.audio.voiceChatMode")}
          value={voiceChatMode.toString()}
          onChange={(value) => setVoiceChatMode(parseInt(value))}
        >
          <option value={VoiceChatMode.Auto}>
            {t("tweaks.audio.voiceChatModeAuto")}
          </option>
          <option value={VoiceChatMode.Area}>
            {t("tweaks.audio.voiceChatModeArea")}
          </option>
          <option value={VoiceChatMode.Team}>
            {t("tweaks.audio.voiceChatModeTeam")}
          </option>
          <option value={VoiceChatMode.None}>
            {t("tweaks.audio.voiceChatModeNone")}
          </option>
        </ComboRow>
        <SwitchRow
          title={t("tweaks.audio.enablePushToTalk")}
          checked={voicePushToTalkEnabled}
          onChange={(value) => setVoicePushToTalkEnabled(value)}
        />
      </PreferencesGroup>
    </>
  );
}
