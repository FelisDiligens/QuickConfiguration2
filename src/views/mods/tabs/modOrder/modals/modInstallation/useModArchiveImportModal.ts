import { commands, ManagedMod } from "@/commands/bindings";
import { AnyError } from "@/commands/errors";
import Mods from "@/commands/mods";
import { createBaseManagedMod, modsEventBus } from "@/services/mods";
import { updateModsStore, useModsStore } from "@/stores/mods";
import { useProfilesStore } from "@/stores/profiles";
import { useResourceListStore } from "@/stores/resourceList";
import { useToastsStore } from "@/stores/toasts";
import { path } from "@tauri-apps/api";
import { useAtom } from "jotai";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { isModArchiveImportModalShownAtom } from "../";

export function useModArchiveImportModal() {
  const { t } = useTranslation();
  const [show, setShow] = useAtom(isModArchiveImportModalShownAtom);
  const [archives, setArchives] = useState<string[]>([]);

  const getArchives = async () => {
    try {
      const state = useModsStore.getState().state;
      const resources = useResourceListStore.getState().resources;
      const gameDataPath = useProfilesStore.getState().getGameDataPath();
      if (!gameDataPath) throw new Error(t("mods.errors.unsetGamePath"));

      modsEventBus.emitProgressUpdated(t("common.loading"));

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

      setArchives(resourcesNotBelongingToAnyMod);
      setShow(true);

      modsEventBus.emitProgressFinished();
    } catch (error) {
      modsEventBus.emitProgressAborted(error as AnyError);
    }
  };

  /** Copy archives and install the mod */
  const installArchives = async (
    modName: string,
    archiveNames: string[],
    partialModDetails: Partial<ManagedMod>,
  ) => {
    try {
      const managedMods = useModsStore.getState().getManagedMods();
      const modsPath = useProfilesStore.getState().getModsPath();
      const gamePath = useProfilesStore.getState().getGamePath();
      if (!modsPath || !gamePath)
        throw new Error(t("mods.errors.unsetModsPathOrGamePath"));

      modsEventBus.emitProgressUpdated(
        t("mods.modOrderTab.progress.installingMod"),
      );

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

      modsEventBus.emitProgressFinished();
      useToastsStore
        .getState()
        .addToast(t("mods.modOrderTab.toasts.modInstalled"), modDetails.title);
    } catch (error) {
      modsEventBus.emitProgressAborted(error as AnyError);
    }
  };

  return {
    getArchives: () => getArchives().catch(console.error),
    modalProps: {
      show,
      archives,
      onCreate: (modName: string, archiveNames: string[]) => {
        setShow(false);
        installArchives(modName, archiveNames, {}).catch(console.error);
      },
      onAbort: () => {
        setShow(false);
      },
    },
  };
}
