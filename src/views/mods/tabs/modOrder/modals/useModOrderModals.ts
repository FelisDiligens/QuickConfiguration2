import useListen from "@/hooks/useListen";
import { modsEventBus } from "@/services/mods";
import { nxmLinksQueueService } from "@/services/nxm";
import { useModalStore } from "@/stores/modals";
import { TauriEvent } from "@tauri-apps/api/event";
import { PhysicalPosition } from "@tauri-apps/api/window";
import { useEffect } from "react";
import { useArchive2Modals } from "./archive2/useArchive2Modals";
import { useModConflictingFilesModal } from "./modActions/useModConflictingFilesModal";
import { useModDownloadModals } from "./modDownload/useModDownloadModals";
import { useModArchiveImportModal } from "./modInstallation/useModArchiveImportModal";
import { useModInstallationModals } from "./modInstallation/useModInstallationModals";
import { useNexusModsModals } from "./nexusMods/useNexusModsModals";
import { useModDeploymentModals } from "./useModDeploymentModals";
import { useModManagementModals } from "./useModManagementModals";

interface TauriDragDropEvent {
  paths?: string[];
  position?: PhysicalPosition;
}

export default function useModOrderModals() {
  const isAnyModalShown = useModalStore((store) => store.isAnyOpen());

  const { deployMods } = useModDeploymentModals();
  const { deleteMod } = useModManagementModals();
  const { showConflicts } = useModConflictingFilesModal();
  const {
    checkForUpdates,
    retrieveModInfoAll,
    endorseAll,
    retrieveModInfo,
    endorse,
    abstain,
    showLoggedOutModal,
    trackModFile,
  } = useNexusModsModals();
  const {
    openArchive,
    exploreArchive,
    extractArchive,
    createArchive,
    autoPackBa2Archives,
    readArchiveInfo,
  } = useArchive2Modals();
  const {
    updateMod,
    requestDownloadLinks,
    isPendingRef: isDownloadPending,
  } = useModDownloadModals({
    onNotLoggedIn: () => showLoggedOutModal().catch(console.error),
    onInstallMod: (filePath, partialModDetails, updateModKey) => {
      installFromFileWithPath(filePath, partialModDetails, updateModKey).catch(
        console.error,
      );
    },
  });
  const {
    installFromFile,
    installFromFileWithPath,
    installFromPaths,
    installFromFolder,
  } = useModInstallationModals();
  const { importArchives } = useModArchiveImportModal();

  // React to messages:
  useEffect(
    () =>
      modsEventBus.onModsEvent((message) => {
        switch (message.type) {
          /*
            Mod deployment
          */
          case "mods-deploy":
            deployMods().catch(console.error);
            break;

          /*
            Mod installation
          */
          case "mods-install-from-file":
            installFromFile().catch(console.error);
            break;
          case "mods-install-from-file-with-path":
            installFromFileWithPath(
              message.path,
              message.details,
              message.updateModKey,
            ).catch(console.error);
            break;
          case "mods-install-from-paths":
            installFromPaths(message.paths, message.details).catch(
              console.error,
            );
            break;
          case "mods-install-from-folder":
            installFromFolder().catch(console.error);
            break;
          case "mods-import-installed-archives":
            importArchives().catch(console.error);
            break;

          /*
            Mod downloads
          */
          case "nexus-mods-update-mod":
            updateMod(message.key).catch(console.error);
            break;

          /*
            Mod management
          */
          case "mods-delete-mod":
            deleteMod(message.key).catch(console.error);
            break;

          /*
            Mod extras
          */
          case "mods-show-conflicting-files":
            showConflicts().catch(console.error);
            break;

          /*
            NexusMods integration
          */
          case "nexus-mods-check-for-updates":
            checkForUpdates().catch(console.error);
            break;
          case "nexus-mods-download-mods-info":
            retrieveModInfoAll().catch(console.error);
            break;
          case "nexus-mods-endorse-all-mods":
            endorseAll().catch(console.error);
            break;
          case "nexus-mods-download-mod-info":
            retrieveModInfo(message.key).catch(console.error);
            break;
          case "nexus-mods-endorse-mod":
            endorse(message.key).catch(console.error);
            break;
          case "nexus-mods-abstain-mod":
            abstain(message.key).catch(console.error);
            break;
          case "nexus-mods-not-logged-in":
            showLoggedOutModal().catch(console.error);
            break;
          case "nexus-mods-track-mod-file":
            trackModFile(message.key).catch(console.error);
            break;

          /*
            Archive2
          */
          case "archive2-open":
            openArchive().catch(console.error);
            break;
          case "archive2-pick-file-explore-ba2-archive":
            exploreArchive().catch(console.error);
            break;
          case "archive2-pick-file-extract-ba2-archive":
            extractArchive().catch(console.error);
            break;
          case "archive2-pick-create-ba2-archive":
            createArchive().catch(console.error);
            break;
          case "archive2-auto-pack-into-archives":
            autoPackBa2Archives().catch(console.error);
            break;
          case "archive2-pick-file-display-info-ba2-archive":
            readArchiveInfo().catch(console.error);
            break;
        }
      }),
    [],
  );

  // React to drag and drop:
  useListen<TauriDragDropEvent>(TauriEvent.DRAG_DROP, (e) => {
    const paths = e.payload.paths;
    if (paths && paths.length > 0) {
      installFromPaths(paths, {}).catch(console.error);
    }
  });

  // React to opened NXM links:
  useEffect(() => {
    const interval = setInterval(() => {
      if (isDownloadPending.current) return; // If currently busy, skip.
      if (isAnyModalShown) return; // If currently any modal is shown, skip.
      const nxmLink = nxmLinksQueueService.next();
      if (!nxmLink) return; // If link is undefined/null, skip.
      requestDownloadLinks(nxmLink).catch(console.error);
    }, 1000);
    return () => clearInterval(interval);
  }, [isAnyModalShown]);
}
