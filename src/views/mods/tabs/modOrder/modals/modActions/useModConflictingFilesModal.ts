import { AnyError } from "@/commands/errors";
import Mods from "@/commands/mods";
import { openModal } from "@/hooks/useModal";
import { modsEventBus } from "@/services/mods";
import { useModsStore } from "@/stores/mods";
import { useProfilesStore } from "@/stores/profiles";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import ModConflictingFilesModal from "./ModConflictingFilesModal";

export function useModConflictingFilesModal() {
  const { t } = useTranslation();

  const showConflicts = async () => {
    try {
      const modsPath = useProfilesStore.getState().getModsPath();
      if (!modsPath) throw new Error(t("mods.errors.unsetModsPath"));

      const mods = useModsStore.getState().mods;
      modsEventBus.emitProgressUpdated(
        t("mods.modOrderTab.progress.checkingForConflicts"),
      );

      const conflicts = await Mods.utils.getConflictingFiles(modsPath, mods);

      modsEventBus.emitProgressFinished();

      await openModal(ModConflictingFilesModal, { conflicts });
    } catch (error) {
      modsEventBus.emitProgressAborted(error as AnyError);
    }
  };

  // React to messages:
  useEffect(
    () =>
      modsEventBus.onUIActionEvent((message) => {
        switch (message.type) {
          case "mods-show-conflicting-files":
            showConflicts().catch((reason) => {
              console.error(reason);
              modsEventBus.emitProgressAborted(reason as AnyError);
            });
            break;
          // no default
        }
      }),
    [],
  );

  return { showConflicts };
}
