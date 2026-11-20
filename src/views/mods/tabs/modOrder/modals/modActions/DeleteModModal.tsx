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
      isOpen={props.show}
      data={{
        title: t("mods.modOrderTab.modals.deleteModTitle"),
        children: t("mods.modOrderTab.modals.deleteModText", {
          mod: props.mod?.title || "",
        }),
      }}
      close={(confirmed) => {
        if (confirmed && props.mod?.key) props.onConfirm(props.mod.key);
      }}
      cancel={props.onAbort}
    />
  );
}
