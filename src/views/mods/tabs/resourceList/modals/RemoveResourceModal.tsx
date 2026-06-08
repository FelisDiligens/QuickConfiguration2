import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { useTranslation } from "react-i18next";

interface Props {
  archiveName?: string;
  show: boolean;
  onConfirm: (archiveName: string) => void;
  onAbort: () => void;
}

export default function RemoveResourceModal(props: Props) {
  const { t } = useTranslation();
  return (
    <ConfirmModal
      title={t("mods.resourceListTab.modals.removeArchiveTitle")}
      show={props.show}
      onConfirm={() => {
        if (props.archiveName) props.onConfirm(props.archiveName);
      }}
      onAbort={props.onAbort}
    >
      {t("mods.resourceListTab.modals.removeArchiveText", {
        archive: props.archiveName,
      })}
    </ConfirmModal>
  );
}
