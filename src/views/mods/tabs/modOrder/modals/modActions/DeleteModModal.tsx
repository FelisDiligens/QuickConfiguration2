import { ManagedMod } from "@/commands/bindings";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { useTranslation } from "react-i18next";

interface Props {
  mod?: ManagedMod;
  show: boolean;
  onConfirm: (key: string) => void;
  onAbort: () => void;
}

export default function DeleteModModal(props: Props) {
  const { t } = useTranslation();
  return (
    <ConfirmModal
      title={t("mods.modOrderTab.modals.deleteModTitle")}
      show={props.show}
      onConfirm={() => {
        if (props.mod?.key) props.onConfirm(props.mod.key);
      }}
      onAbort={props.onAbort}
    >
      {t("mods.modOrderTab.modals.deleteModText", {
        mod: props.mod?.title || "",
      })}
    </ConfirmModal>
  );
}
