import { events } from "@/commands/bindings";
import { AnyError } from "@/commands/errors";
import Mods from "@/commands/mods";
import { errorModal, loadingModal } from "@/hooks/useModal";
import { updateModsStore, useModsStore } from "@/stores/mods";
import { useProfilesStore } from "@/stores/profiles";
import { useResourceListStore } from "@/stores/resourceList";
import { useSettingsStore } from "@/stores/settings";
import { useToastsStore } from "@/stores/toasts";
import { formatDuration } from "@/utils";
import { UnlistenFn } from "@tauri-apps/api/event";
import { useTranslation } from "react-i18next";

export function useModDeploymentModals() {
  const { t } = useTranslation();

  const deployMods = async () => {
    let unlisten: UnlistenFn | undefined = undefined;
    const loadingModalState = loadingModal();
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

      loadingModalState.open({
        label: t("mods.modOrderTab.progress.deploying.deploying"),
      });

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
            let progress =
              removedMods / totalMods + removedFiles / totalFiles / totalMods;
            const label = t("mods.modOrderTab.progress.removingModStatusText", {
              removedMods: removedMods + 1,
              totalMods,
              modTitle,
              removedFiles: removedFiles + 1,
              totalFiles,
              fileName,
            });
            progress = globalEnabled ? progress / 2 : progress;
            loadingModalState.update({ label, progress: progress * 100 });
            break;
          }
          case "finalizing-removal":
          case "finished-removal":
          case "preparing-deployment":
            // Unused
            break;
          case "preparing-deployment-of-mod": {
            const { modTitle, deployedMods, totalMods } = event.payload;
            const label = t("mods.modOrderTab.progress.deploying.modXofY", {
              count: deployedMods + 1,
              total: totalMods,
              name: modTitle,
            });
            let progress = deployedMods / totalMods;
            progress = progress / 2 + 0.5;
            loadingModalState.update({ label, progress: progress * 100 });
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
            const label =
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
            let progress =
              deployedMods / totalMods + copiedFiles / totalFiles / totalMods;
            progress = progress / 2 + 0.5;
            loadingModalState.update({ label, progress: progress * 100 });
            break;
          }
          case "finished-deployment":
          case "finished":
            // Unused
            break;
        }
      });

      // Deploy mods:
      const startTime = performance.now();
      const [update, newResources] = await Mods.actions.deploy(
        managedMods,
        modSettings,
        modsPath,
        gamePath,
        resources,
      );
      const duration = formatDuration(performance.now() - startTime);

      // Update state:
      updateModsStore(update);
      useResourceListStore.getState().setResources(newResources);

      // Done:
      await loadingModalState.close();
      if (globalEnabled) {
        const deployedCount = managedMods.mods.filter(
          (mod) => mod.enabled,
        ).length;
        useToastsStore.getState().addToast(
          t("mods.modOrderTab.toasts.modsDeployed"),
          t("mods.modOrderTab.toasts.modsDeployedText", {
            count: deployedCount,
            duration,
          }),
          "success",
        );
      } else {
        useToastsStore.getState().addToast(
          t("mods.modOrderTab.toasts.modsRemoved"),
          t("mods.modOrderTab.toasts.modsRemovedText", {
            count: managedMods.state.length,
            duration,
          }),
          "success",
        );
      }
    } catch (error) {
      console.error(error);
      void errorModal({ reason: error as AnyError });
    } finally {
      if (unlisten) unlisten();
      await loadingModalState.close();
    }
  };

  return {
    deployMods,
  };
}
