import { AnyError } from "@/commands/errors";
import Mods from "@/commands/mods";
import { errorModal, loadingModal, openModal } from "@/hooks/useModal";
import { useModsStore } from "@/stores/mods";
import { useProfilesStore } from "@/stores/profiles";
import { useTranslation } from "react-i18next";
import ModConflictingFilesModal from "./ModConflictingFilesModal";

export function useModConflictingFilesModal() {
  const { t } = useTranslation();

  const showConflicts = async () => {
    const loadingModalState = loadingModal();
    try {
      const modsPath = useProfilesStore.getState().getModsPath();
      if (!modsPath) throw new Error(t("mods.errors.unsetModsPath"));

      loadingModalState.open({
        label: t("mods.modOrderTab.progress.checkingForConflicts"),
      });

      const mods = useModsStore.getState().mods;
      const conflicts = await Mods.utils.getConflictingFiles(modsPath, mods);

      await openModal(ModConflictingFilesModal, { conflicts });
    } catch (error) {
      console.error(error);
      void errorModal({ reason: error as AnyError });
    } finally {
      await loadingModalState.close();
    }
  };

  return { showConflicts };
}
