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
      isOpen={props.show}
      data={{
        title: t("mods.resourceListTab.modals.removeArchiveTitle"),
        children: t("mods.resourceListTab.modals.removeArchiveText", {
          archive: props.archiveName,
        }),
      }}
      close={(confirmed) => {
        if (confirmed && props.archiveName) props.onConfirm(props.archiveName);
      }}
      cancel={props.onAbort}
    />
  );
}
