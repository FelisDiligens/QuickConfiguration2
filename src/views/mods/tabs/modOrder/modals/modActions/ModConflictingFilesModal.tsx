import { Conflict } from "@/commands/bindings";
import { MessageModal } from "@/components/modals/MessageModal";
import { useModsStore } from "@/stores/mods";
import { useTranslation } from "react-i18next";

interface Props {
  show: boolean;
  conflicts: Conflict[];
  onHide: () => void;
}

export default function ModConflictingFilesModal(props: Props) {
  const { t } = useTranslation();
  const getMod = useModsStore((s) => s.getMod);
  return (
    <MessageModal
      title={t("mods.modOrderTab.modals.conflictsModal.title")}
      show={props.show}
      onHide={props.onHide}
    >
      {props.conflicts.length == 0 && (
        <p>{t("mods.modOrderTab.modals.conflictsModal.noConflictsFound")}</p>
      )}
      {props.conflicts.map((conflict) => {
        const lowerMod =
          getMod(conflict.lower_mod_id)?.title || conflict.lower_mod_id;
        const upperMod =
          getMod(conflict.upper_mod_id)?.title || conflict.upper_mod_id;
        const fileCount = conflict.files.length;
        return (
          <p key={`${conflict.lower_mod_id}_${conflict.upper_mod_id}`}>
            {t("mods.modOrderTab.modals.conflictsModal.conflictText", {
              lowerMod,
              upperMod,
              count: fileCount,
            })}
            <ul>
              {conflict.files.map((file) => (
                <li key={file}>
                  <code>{file}</code>
                </li>
              ))}
            </ul>
          </p>
        );
      })}
    </MessageModal>
  );
}
