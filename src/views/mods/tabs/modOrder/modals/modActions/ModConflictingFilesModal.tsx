import { Conflict } from "@/commands/bindings";
import { MessageModal } from "@/components/modals/MessageModal";
import { useModsStore } from "@/stores/mods";
import { ModalComponentProps } from "@/stores/modals";
import { useTranslation } from "react-i18next";

export interface ModConflictingFilesModalData {
  conflicts: Conflict[];
}

export default function ModConflictingFilesModal(
  props: ModalComponentProps<ModConflictingFilesModalData, void>,
) {
  const { t } = useTranslation();
  const getMod = useModsStore((s) => s.getMod);
  return (
    <MessageModal
      isOpen={props.isOpen}
      data={{
        title: t("mods.modOrderTab.modals.conflictsModal.title"),
        children: (
          <>
            {props.data.conflicts.length == 0 && (
              <p>
                {t("mods.modOrderTab.modals.conflictsModal.noConflictsFound")}
              </p>
            )}
            {props.data.conflicts.map((conflict) => {
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
          </>
        ),
      }}
      close={props.close}
      cancel={props.cancel}
    />
  );
}
