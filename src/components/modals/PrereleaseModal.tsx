import { commands } from "@/commands/bindings";
import { useAsync } from "@/hooks/async";
import { info } from "@/info";
import { useSettingsStore } from "@/stores/settings";
import { Trans, useTranslation } from "react-i18next";
import { MessageModal } from "./MessageModal";

export default function PrereleaseModal() {
  const { t } = useTranslation();
  const { data: isPrerelease } = useAsync(commands.isPrerelease);
  const isDismissed = useSettingsStore((s) => s.prereleaseDismissed);
  const setPrereleaseDismissed = useSettingsStore(
    (s) => s.setPrereleaseDismissed,
  );
  const show = !!isPrerelease && !isDismissed;
  return (
    <MessageModal
      title={t("prereleaseModal.title")}
      show={show}
      onHide={() => setPrereleaseDismissed(true)}
    >
      <Trans
        t={t}
        i18nKey="prereleaseModal.text"
        values={{ version: info.version }}
        components={{ code: <code /> }}
      />
    </MessageModal>
  );
}
