import { getFileSize } from "@/commands/additions";
import {
  Archive2Compression,
  Archive2Format,
  Archive2Info,
  commands,
} from "@/commands/bindings";
import { AnyError } from "@/commands/errors";
import Mods from "@/commands/mods";
import { modsEventBus } from "@/services/mods";
import { useToastsStore } from "@/stores/toasts";
import { useTranslation } from "react-i18next";

export interface ExtendedArchive2Info extends Archive2Info {
  fileSize: number;
  filePath: string;
}

export function useArchive2() {
  const { t } = useTranslation();

  const emitShowErrorModal = (error: AnyError) => {
    modsEventBus.emitProgressFinished(); // Emit finished to hide loading modal
    modsEventBus.emitArchive2Event({ type: "show-error-modal", error });
  };

  const openArchive2 = async () => {
    try {
      await commands.archive2OpenProgram();
    } catch (error) {
      emitShowErrorModal(error as AnyError);
    }
  };

  const exploreArchive = async (path: string) => {
    try {
      await commands.archive2ExploreArchive(path);
    } catch (error) {
      emitShowErrorModal(error as AnyError);
    }
  };

  const createArchive = async (
    archivePath: string,
    sourcePath: string,
    format: Archive2Format,
    compression: Archive2Compression,
  ) => {
    try {
      modsEventBus.emitProgressUpdated(
        t("mods.modOrderTab.progress.creatingArchive"),
      );
      await commands.archive2CreateArchive(
        archivePath,
        sourcePath,
        format,
        compression,
      );
      modsEventBus.emitProgressFinished();
      useToastsStore
        .getState()
        .addToast(t("mods.modOrderTab.toasts.archive2Created"), "", "success");
    } catch (error) {
      emitShowErrorModal(error as AnyError);
    }
  };

  const extractArchive = async (
    archivePath: string,
    destinationPath: string,
  ) => {
    try {
      modsEventBus.emitProgressUpdated(
        t("mods.modOrderTab.progress.extractingArchive"),
      );
      await commands.archive2ExtractArchive(archivePath, destinationPath);
      modsEventBus.emitProgressFinished();
      useToastsStore
        .getState()
        .addToast(
          t("mods.modOrderTab.toasts.archive2Extracted"),
          "",
          "success",
        );
    } catch (error) {
      emitShowErrorModal(error as AnyError);
    }
  };

  const autoPackBa2Archives = async (
    modName: string,
    sourcePath: string,
    destinationPath: string,
    tempPath: string,
  ) => {
    try {
      modsEventBus.emitProgressUpdated(
        t("mods.modOrderTab.progress.autoPackingArchives"),
      );
      await Mods.utils.autoPackBa2Archives(
        modName,
        sourcePath,
        destinationPath,
        tempPath,
      );
      modsEventBus.emitProgressFinished();
      useToastsStore
        .getState()
        .addToast(
          t("mods.modOrderTab.toasts.archive2AutoPacked"),
          "",
          "success",
        );
    } catch (error) {
      emitShowErrorModal(error as AnyError);
    }
  };

  const readArchive2Info = async (path: string) => {
    try {
      modsEventBus.emitProgressUpdated(t("common.loading"));
      const info = await commands.archive2ReadArchive(path);
      const size = await getFileSize(path);
      const extendedInfo: ExtendedArchive2Info = {
        ...info,
        fileSize: size,
        filePath: path,
      };
      modsEventBus.emitProgressFinished();
      return extendedInfo;
    } catch (error) {
      emitShowErrorModal(error as AnyError);
    }
  };

  return {
    openArchive2,
    exploreArchive,
    createArchive,
    extractArchive,
    autoPackBa2Archives,
    readArchive2Info,
  };
}
