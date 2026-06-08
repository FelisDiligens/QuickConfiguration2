import { AnyError } from "@/commands/errors";
import { useModManagement } from "@/hooks/mods";
import { modsEventBus } from "@/services/mods";
import { useEffect } from "react";
import DeleteModModal from "./DeleteModModal";
import ModConflictingFilesModal from "./ModConflictingFilesModal";
import { useModConflictingFilesModal } from "./useModConflictingFilesModal";

export default function ModActionModals() {
  const { deleteMod, deleteModModalProps } = useModManagement();
  const { getConflicts, modalProps: conflictModalProps } =
    useModConflictingFilesModal();

  // React to messages:
  useEffect(
    () =>
      modsEventBus.onUIActionEvent((message) => {
        switch (message.type) {
          case "mods-delete-mod":
            deleteMod(message.key);
            break;
          case "mods-show-conflicting-files":
            getConflicts().catch((reason) => {
              console.error(reason);
              modsEventBus.emitProgressAborted(reason as AnyError);
            });
            break;
          // no default
        }
      }),
    [],
  );

  return (
    <>
      <DeleteModModal {...deleteModModalProps} />
      <ModConflictingFilesModal {...conflictModalProps} />
    </>
  );
}
