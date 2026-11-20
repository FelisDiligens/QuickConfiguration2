import { AnyError } from "@/commands/errors";
import { useModInstallation } from "@/hooks/mods";
import useListen from "@/hooks/useListen";
import { modsEventBus } from "@/services/mods";
import { TauriEvent } from "@tauri-apps/api/event";
import { PhysicalPosition } from "@tauri-apps/api/window";
import { useEffect } from "react";
import { useModArchiveImportModal } from "./useModArchiveImportModal";

interface TauriDragDropEvent {
  paths?: string[];
  position?: PhysicalPosition;
}

export function useModInstallationModals() {
  const {
    installFromFile,
    installFromFileWithPath,
    installFromPaths,
    installFromFolder,
  } = useModInstallation();
  const { getArchives } = useModArchiveImportModal();

  // React to messages:
  useEffect(
    () =>
      modsEventBus.onUIActionEvent((message) => {
        switch (message.type) {
          case "mods-install-from-file":
            installFromFile().catch((reason) => {
              console.error(reason);
              modsEventBus.emitProgressAborted(reason as AnyError);
            });
            break;
          case "mods-install-from-file-with-path":
            installFromFileWithPath(
              message.path,
              message.details,
              message.updateModKey,
            ).catch((reason) => {
              console.error(reason);
              modsEventBus.emitProgressAborted(reason as AnyError);
            });
            break;
          case "mods-install-from-paths":
            installFromPaths(message.paths, message.details).catch((reason) => {
              console.error(reason);
              modsEventBus.emitProgressAborted(reason as AnyError);
            });
            break;
          case "mods-install-from-folder":
            installFromFolder().catch((reason) => {
              console.error(reason);
              modsEventBus.emitProgressAborted(reason as AnyError);
            });
            break;
          case "mods-import-installed-archives":
            getArchives().catch((reason) => {
              console.error(reason);
              modsEventBus.emitProgressAborted(reason as AnyError);
            });
            break;
          // no default
        }
      }),
    [],
  );

  // React to drag and drop:
  useListen<TauriDragDropEvent>(TauriEvent.DRAG_DROP, (e) => {
    const paths = e.payload.paths;
    if (paths && paths.length > 0) {
      modsEventBus.emitInstallModFromPaths(paths, {});
    }
  });
}
