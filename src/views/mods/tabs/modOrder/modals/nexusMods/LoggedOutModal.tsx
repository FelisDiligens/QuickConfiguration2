import { MessageModal } from "@/components/modals/MessageModal";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

interface Props {
  show: boolean;
  onHide: () => void;
}

export default function LoggedOutModal(props: Props) {
  const { t } = useTranslation();
  return (
    <MessageModal
      title={t("mods.modOrderTab.modals.loggedOutModal.title")}
      show={props.show}
      onHide={props.onHide}
    >
      <p>
        <Trans
          t={t}
          i18nKey="mods.modOrderTab.modals.loggedOutModal.message"
          components={{ a: <Link to="/nexusmods" /> }}
        />
      </p>
    </MessageModal>
  );
}
