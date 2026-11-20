import { info } from "@/info";
import { ModalComponentProps } from "@/stores/modals";
import { useSettingsStore } from "@/stores/settings";
import { Trans, useTranslation } from "react-i18next";
import { MessageModal } from "./MessageModal";

export default function PrereleaseModal(
  props: ModalComponentProps<void, void>,
) {
  const { t } = useTranslation();
  const setPrereleaseDismissed = useSettingsStore(
    (s) => s.setPrereleaseDismissed,
  );

  const dismiss = () => {
    setPrereleaseDismissed(true);
    props.cancel();
  };

  return (
    <MessageModal
      isOpen={props.isOpen}
      data={{
        title: t("prereleaseModal.title"),
        children: (
          <Trans
            t={t}
            i18nKey="prereleaseModal.text"
            values={{ version: info.version }}
            components={{ code: <code /> }}
          />
        ),
      }}
      close={dismiss}
      cancel={dismiss}
    />
  );
}
