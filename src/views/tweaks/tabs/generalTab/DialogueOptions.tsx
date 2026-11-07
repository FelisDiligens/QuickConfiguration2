import PreferencesGroup from "@/components/common/PreferencesGroup";
import SliderRow from "@/components/common/SliderRow";
import SwitchRow from "@/components/common/SwitchRow";
import useConversationHistorySize from "@/hooks/tweaks/interface/useConversationHistorySize";
import useDialogueSubtitles from "@/hooks/tweaks/interface/useDialogueSubtitles";
import useGeneralSubtitles from "@/hooks/tweaks/interface/useGeneralSubtitles";
import useShowDialogueHistory from "@/hooks/tweaks/interface/useShowDialogueHistory";
import { useTranslation } from "react-i18next";

export default function DialogueOptions() {
  const { t } = useTranslation();

  const [generalSubtitles, setGeneralSubtitles] = useGeneralSubtitles();
  const [dialogueSubtitles, setDialogueSubtitles] = useDialogueSubtitles();
  const [showDialogueHistory, setShowDialogueHistory] =
    useShowDialogueHistory();
  const [historySize, setHistorySize] = useConversationHistorySize();

  return (
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
  );
}
