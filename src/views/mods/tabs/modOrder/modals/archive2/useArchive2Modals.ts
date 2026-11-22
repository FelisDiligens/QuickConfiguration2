import { getFileSize } from "@/commands/additions";
import { commands } from "@/commands/bindings";
import { AnyError } from "@/commands/errors";
import Mods from "@/commands/mods";
import { loadingModal, openModal } from "@/hooks/useModal";
import { useToastsStore } from "@/stores/toasts";
import * as dialog from "@tauri-apps/plugin-dialog";
import { useTranslation } from "react-i18next";
import Archive2AutoPackModal from "./Archive2AutoPackModal";
import Archive2CreateModal from "./Archive2CreateModal";
import Archive2ErrorModal from "./Archive2ErrorModal";
import Archive2ExtractModal from "./Archive2ExtractModal";
import Archive2InfoModal from "./Archive2InfoModal";
import { ExtendedArchive2Info } from "./types";

export function useArchive2Modals() {
  const { t } = useTranslation();

  async function openArchive() {
    try {
      await commands.archive2OpenProgram();
    } catch (error) {
      console.error(error);
      void openModal(Archive2ErrorModal, { reason: error as AnyError });
    }
  }

  async function exploreArchive() {
    const path = await dialog.open({
      directory: false,
      multiple: false,
    });
    if (path == null) return;

    try {
      await commands.archive2ExploreArchive(path);
    } catch (error) {
      console.error(error);
      void openModal(Archive2ErrorModal, { reason: error as AnyError });
    }
  }

  async function readArchiveInfo() {
    const path = await dialog.open({
      directory: false,
      multiple: false,
    });
    if (path == null) return;

    const loadingModalState = loadingModal().open({
      label: t("common.loading"),
    });
    try {
      const info = await commands.archive2ReadArchive(path);
      const size = await getFileSize(path);
      const extendedInfo: ExtendedArchive2Info = {
        ...info,
        fileSize: size,
        filePath: path,
      };
      await loadingModalState.close();
      await openModal(Archive2InfoModal, { info: extendedInfo });
    } catch (error) {
      console.error(error);
      void openModal(Archive2ErrorModal, { reason: error as AnyError });
    } finally {
      await loadingModalState.close();
    }
  }

  async function createArchive() {
    const result = await openModal(Archive2CreateModal, undefined);
    if (!result) return;

    const loadingModalState = loadingModal().open({
      label: t("mods.modOrderTab.progress.creatingArchive"),
    });
    try {
      await commands.archive2CreateArchive(
        result.archivePath,
        result.sourcePath,
        result.format,
        result.compression,
      );
      useToastsStore
        .getState()
        .addToast(t("mods.modOrderTab.toasts.archive2Created"), "", "success");
    } catch (error) {
      console.error(error);
      void openModal(Archive2ErrorModal, { reason: error as AnyError });
    } finally {
      await loadingModalState.close();
    }
  }

  async function extractArchive() {
    const result = await openModal(Archive2ExtractModal, undefined);
    if (!result) return;

    const loadingModalState = loadingModal().open({
      label: t("mods.modOrderTab.progress.extractingArchive"),
    });
    try {
      await commands.archive2ExtractArchive(
        result.archivePath,
        result.destinationPath,
      );
      useToastsStore
        .getState()
        .addToast(
          t("mods.modOrderTab.toasts.archive2Extracted"),
          "",
          "success",
        );
    } catch (error) {
      console.error(error);
      void openModal(Archive2ErrorModal, { reason: error as AnyError });
    } finally {
      await loadingModalState.close();
    }
  }

  async function autoPackBa2Archives() {
    const result = await openModal(Archive2AutoPackModal, undefined);
    if (!result) return;

    const loadingModalState = loadingModal().open({
      label: t("mods.modOrderTab.progress.autoPackingArchives"),
    });
    try {
      await Mods.utils.autoPackBa2Archives(
        result.modName,
        result.sourcePath,
        result.destinationPath,
        result.tempPath,
      );
      useToastsStore
        .getState()
        .addToast(
          t("mods.modOrderTab.toasts.archive2AutoPacked"),
          "",
          "success",
        );
    } catch (error) {
      console.error(error);
      void openModal(Archive2ErrorModal, { reason: error as AnyError });
    } finally {
      await loadingModalState.close();
    }
  }

  return {
    openArchive,
    exploreArchive,
    extractArchive,
    createArchive,
    autoPackBa2Archives,
    readArchiveInfo,
  };
}
