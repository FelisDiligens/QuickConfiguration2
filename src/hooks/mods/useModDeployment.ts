import { events } from "@/commands/bindings";
import { AnyError } from "@/commands/errors";
import Mods from "@/commands/mods";
import { modsEventBus } from "@/services/mods";
import { updateModsStore, useModsStore } from "@/stores/mods";
import { useProfilesStore } from "@/stores/profiles";
import { useResourceListStore } from "@/stores/resourceList";
import { useSettingsStore } from "@/stores/settings";
import { useToastsStore } from "@/stores/toasts";
import { UnlistenFn } from "@tauri-apps/api/event";
import { useTranslation } from "react-i18next";

export function useModDeployment() {
  const { t } = useTranslation();

  const deployMods = async () => {
    let unlisten: UnlistenFn | undefined = undefined;
    try {
      // Get all required state:
      const managedMods = useModsStore.getState().getManagedMods();
      const modSettings = useSettingsStore.getState().modManager;
      const modsPath = useProfilesStore.getState().getModsPath();
      const gamePath = useProfilesStore.getState().getGamePath();
      const resources = useResourceListStore.getState().resources;

      const globalEnabled = managedMods.enabled;

      if (!modsPath || !gamePath)
        throw new Error(t("mods.errors.unsetModsPathOrGamePath"));

      modsEventBus.emitProgressUpdated(
        t("mods.modOrderTab.progress.deploying.deploying"),
      );

      // Listen to progress events:
      unlisten = await events.modsDeployProgressUpdate.listen((event) => {
        switch (event.payload.status) {
          case "preparing":
          case "preparing-removal":
            // Unused
            break;
          case "removing-mod": {
            const {
              modTitle,
              removedMods,
              totalMods,
              fileName,
              removedFiles,
              totalFiles,
            } = event.payload;
            let percent =
              removedMods / totalMods + removedFiles / totalFiles / totalMods;
            const text = t("mods.modOrderTab.progress.removingModStatusText", {
              removedMods: removedMods + 1,
              totalMods,
              modTitle,
              removedFiles: removedFiles + 1,
              totalFiles,
              fileName,
            });
            percent = globalEnabled ? percent / 2 : percent;
            modsEventBus.emitProgressUpdated(text, percent);
            break;
          }
          case "finalizing-removal":
          case "finished-removal":
          case "preparing-deployment":
            // Unused
            break;
          case "preparing-deployment-of-mod": {
            const { modTitle, deployedMods, totalMods } = event.payload;
            const text = t("mods.modOrderTab.progress.deploying.modXofY", {
              count: deployedMods + 1,
              total: totalMods,
              name: modTitle,
            });
            let percent = deployedMods / totalMods;
            percent = percent / 2 + 0.5;
            modsEventBus.emitProgressUpdated(text, percent);
            break;
          }
          case "deploying-mod": {
            const {
              modTitle,
              deployedMods,
              totalMods,
              fileName,
              copiedFiles,
              totalFiles,
            } = event.payload;
            const text =
              t("mods.modOrderTab.progress.deploying.modXofY", {
                count: deployedMods + 1,
                total: totalMods,
                name: modTitle,
              }) +
              ", " +
              t("mods.modOrderTab.progress.deploying.fileXofY", {
                count: copiedFiles + 1,
                total: totalFiles,
                name: fileName,
              });
            let percent =
              deployedMods / totalMods + copiedFiles / totalFiles / totalMods;
            percent = percent / 2 + 0.5;
            modsEventBus.emitProgressUpdated(text, percent);
            break;
          }
          case "finished-deployment":
          case "finished":
            // Unused
            break;
        }
      });

      // Deploy mods:
      const [update, newResources] = await Mods.actions.deploy(
        managedMods,
        modSettings,
        modsPath,
        gamePath,
        resources,
      );

      // Update state:
      updateModsStore(update);
      useResourceListStore.getState().setResources(newResources);

      // Done:
      modsEventBus.emitProgressFinished();
      if (globalEnabled) {
        useToastsStore
          .getState()
          .addToast(t("mods.modOrderTab.toasts.modsDeployed"), "", "success"); // TODO: Add details, e.g. how many mods were deployed, how long it took, etc.
      } else {
        useToastsStore
          .getState()
          .addToast(t("mods.modOrderTab.toasts.modsRemoved"), "", "success"); // TODO: Add details, e.g. how many mods were removed, how long it took, etc.
      }
    } catch (error) {
      modsEventBus.emitProgressAborted(error as AnyError);
    } finally {
      if (unlisten) unlisten();
    }
  };

  return {
    deployMods,
  };
}
