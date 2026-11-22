import { commands, ManagedMod } from "@/commands/bindings";
import { AnyError } from "@/commands/errors";
import Mods from "@/commands/mods";
import { errorModal, loadingModal, openModal } from "@/hooks/useModal";
import { createBaseManagedMod } from "@/services/mods";
import { updateModsStore, useModsStore } from "@/stores/mods";
import { useProfilesStore } from "@/stores/profiles";
import { useResourceListStore } from "@/stores/resourceList";
import { useToastsStore } from "@/stores/toasts";
import { path } from "@tauri-apps/api";
import { useTranslation } from "react-i18next";
import ModArchiveImportModal from "./ModArchiveImportModal";

export function useModArchiveImportModal() {
  const { t } = useTranslation();

  const importArchives = async () => {
    const loadingModalState = loadingModal();
    try {
      const state = useModsStore.getState().state;
      const resources = useResourceListStore.getState().resources;
      const gameDataPath = useProfilesStore.getState().getGameDataPath();
      if (!gameDataPath) throw new Error(t("mods.errors.unsetGamePath"));

      loadingModalState.open({
        label: t("common.loading"),
      });

      const deployedResources = (
        await Mods.utils.getDeployedArchives(state)
      ).map((resource) => resource.archiveName);

      const resourcesNotBelongingToAnyMod = [];
      for (const resource of resources) {
        if (deployedResources.includes(resource)) continue;
        if (!(await commands.isFile(await path.join(gameDataPath, resource))))
          continue;
        resourcesNotBelongingToAnyMod.push(resource);
      }

      await loadingModalState.close();
      const result = await openModal(ModArchiveImportModal, {
        archives: resourcesNotBelongingToAnyMod,
      });
      if (result) {
        await installArchives(result.modName, result.archiveNames, {});
      }
    } catch (error) {
      console.error(error);
      void errorModal({ reason: error as AnyError });
    } finally {
      await loadingModalState.close();
    }
  };

  /** Copy archives and install the mod */
  const installArchives = async (
    modName: string,
    archiveNames: string[],
    partialModDetails: Partial<ManagedMod>,
  ) => {
    const loadingModalState = loadingModal();
    try {
      const managedMods = useModsStore.getState().getManagedMods();
      const modsPath = useProfilesStore.getState().getModsPath();
      const gamePath = useProfilesStore.getState().getGamePath();
      if (!modsPath || !gamePath)
        throw new Error(t("mods.errors.unsetModsPathOrGamePath"));

      loadingModalState.open({
        label: t("mods.modOrderTab.progress.installingMod"),
      });

      const modDetails = {
        ...createBaseManagedMod(modName),
        ...partialModDetails,
      };

      const update =
        await Mods.actions.installation.installFromExistingArchives(
          managedMods,
          gamePath,
          modsPath,
          modDetails,
          archiveNames,
        );
      updateModsStore(update);

      useToastsStore
        .getState()
        .addToast(t("mods.modOrderTab.toasts.modInstalled"), modDetails.title);
    } catch (error) {
      console.error(error);
      void errorModal({ reason: error as AnyError });
    } finally {
      await loadingModalState.close();
    }
  };

  return {
    importArchives,
  };
}
