import PreferencesGroup from "@/components/common/PreferencesGroup";
import SwitchRow from "@/components/common/SwitchRow";
import useAutoTrackQuestWhenStarted from "@/hooks/tweaks/interface/useAutoTrackQuestWhenStarted";
import useEnableQuestTrackNotification from "@/hooks/tweaks/interface/useEnableQuestTrackNotification";
import { useTranslation } from "react-i18next";

export default function QuestsOptions() {
  const { t } = useTranslation();

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
  );
}
