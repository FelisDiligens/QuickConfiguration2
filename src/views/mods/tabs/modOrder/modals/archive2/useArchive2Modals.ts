import { useArchive2 } from "@/hooks/mods";
import { openModal } from "@/hooks/useModal";
import { modsEventBus } from "@/services/mods";
import * as dialog from "@tauri-apps/plugin-dialog";
import { useEffect } from "react";
import Archive2AutoPackModal from "./Archive2AutoPackModal";
import Archive2CreateModal from "./Archive2CreateModal";
import Archive2ErrorModal from "./Archive2ErrorModal";
import Archive2ExtractModal from "./Archive2ExtractModal";
import Archive2InfoModal from "./Archive2InfoModal";

export function useArchive2Modals() {
  const {
    openArchive2,
    exploreArchive,
    readArchive2Info,
    createArchive,
    extractArchive,
    autoPackBa2Archives,
  } = useArchive2();

  async function doExploreArchive2() {
    const path = await dialog.open({
      directory: false,
      multiple: false,
    });
    if (path == null) return;
    try {
      await exploreArchive(path);
    } catch (reason) {
      console.error(reason);
    }
  }

  async function doShowArchive2Info() {
    const path = await dialog.open({
      directory: false,
      multiple: false,
    });
    if (path == null) return;
    try {
      const info = await readArchive2Info(path);
      if (info) await openModal(Archive2InfoModal, { info });
    } catch (reason) {
      console.error(reason);
    }
  }

  async function showCreateModal() {
    const result = await openModal(Archive2CreateModal, undefined);
    if (result) {
      createArchive(
        result.archivePath,
        result.sourcePath,
        result.format,
        result.compression,
      ).catch(console.error);
    }
  }

  async function showExtractModal() {
    const result = await openModal(Archive2ExtractModal, undefined);
    if (result) {
      extractArchive(result.archivePath, result.destinationPath).catch(
        console.error,
      );
    }
  }

  async function showAutoPackModal() {
    const result = await openModal(Archive2AutoPackModal, undefined);
    if (result) {
      autoPackBa2Archives(
        result.modName,
        result.sourcePath,
        result.destinationPath,
        result.tempPath,
      ).catch(console.error);
    }
  }

  // React to messages:
  useEffect(
    () =>
      modsEventBus.onUIActionEvent((message) => {
        switch (message.type) {
          case "archive2-open":
            openArchive2().catch(console.error);
            break;
          case "archive2-pick-file-explore-ba2-archive":
            doExploreArchive2().catch(console.error);
            break;
          case "archive2-pick-file-extract-ba2-archive":
            showExtractModal().catch(console.error);
            break;
          case "archive2-pick-create-ba2-archive":
            showCreateModal().catch(console.error);
            break;
          case "archive2-auto-pack-into-archives":
            showAutoPackModal().catch(console.error);
            break;
          case "archive2-pick-file-display-info-ba2-archive":
            doShowArchive2Info().catch(console.error);
            break;
          // no default
        }
      }),
    [],
  );

  useEffect(
    () =>
      modsEventBus.onArchive2Event((message) => {
        switch (message.type) {
          case "show-error-modal":
            openModal(Archive2ErrorModal, { reason: message.error }).catch(
              console.error,
            );
            break;
          // no default
        }
      }),
    [],
  );
}
