import { Conflict } from "@/commands/bindings";
import { AnyError } from "@/commands/errors";
import Mods from "@/commands/mods";
import { modsEventBus } from "@/services/mods";
import { useModsStore } from "@/stores/mods";
import { useProfilesStore } from "@/stores/profiles";
import { useAtom } from "jotai";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { isModConflictingFilesModalShownAtom } from "..";

export function useModConflictingFilesModal() {
  const { t } = useTranslation();
  const [show, setShow] = useAtom(isModConflictingFilesModalShownAtom);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  const getConflicts = async () => {
    try {
      const modsPath = useProfilesStore.getState().getModsPath();
      if (!modsPath) throw new Error(t("mods.errors.unsetModsPath"));

      const mods = useModsStore.getState().mods;
      modsEventBus.emitProgressUpdated(
        t("mods.modOrderTab.progress.checkingForConflicts"),
      );

      const conflicts = await Mods.utils.getConflictingFiles(modsPath, mods);
      setConflicts(conflicts);
      setShow(true);

      modsEventBus.emitProgressFinished();
    } catch (error) {
      modsEventBus.emitProgressAborted(error as AnyError);
    }
  };

  return {
    getConflicts: () => getConflicts().catch(console.error),
    modalProps: {
      show,
      conflicts,
      onHide: () => {
        setShow(false);
      },
    },
  };
}
