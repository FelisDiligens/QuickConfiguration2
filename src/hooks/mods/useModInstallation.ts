import { commands, DirEntry, ManagedMod } from "@/commands/bindings";
import { AnyError, commandErrorToString } from "@/commands/errors";
import Mods from "@/commands/mods";
import { createBaseManagedMod, modsEventBus } from "@/services/mods";
import { updateModsStore, useModsStore } from "@/stores/mods";
import { useProfilesStore } from "@/stores/profiles";
import { useToastsStore } from "@/stores/toasts";
import { path } from "@tauri-apps/api";
import * as dialog from "@tauri-apps/plugin-dialog";
import { atom, useAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { isModInstallationDetailsModalShownAtom } from "@/views/mods/tabs/modOrder/modals";

const fileContentsAtom = atom<DirEntry[]>([]);
const modAtom = atom<ManagedMod>(createBaseManagedMod());

export function useModInstallation() {
  const { t } = useTranslation();

  const [showModal, setShowModal] = useAtom(
    isModInstallationDetailsModalShownAtom,
  );
  const [fileContents, setFileContents] = useAtom(fileContentsAtom);
  const [mod, setMod] = useAtom(modAtom);

  const openInstallModal = (
    modDetails: ManagedMod,
    fileContents: DirEntry[],
  ) => {
    setMod(modDetails);
    setFileContents(fileContents);
    setShowModal(true);
  };

  const closeInstallModal = () => {
    setShowModal(false);
  };

  /** Copy file (or extract archive) into temporary directory */
  const installFromFile = async () => {
    try {
      const filePath = await dialog.open({
        directory: false,
        multiple: false,
      });
      if (!filePath) return;
      await installFromFileWithPath(filePath, {});
    } catch (error) {
      modsEventBus.emitProgressAborted(error as AnyError);
    }
  };

  /** Copy file (or extract archive) into temporary directory */
  const installFromFileWithPath = async (
    filePath: string,
    partialModDetails: Partial<ManagedMod>,
  ) => {
    try {
      const modsPath = useProfilesStore.getState().getModsPath();
      const tmpPath = useProfilesStore.getState().getModsTmpPath();
      if (!modsPath || !tmpPath)
        throw new Error(t("mods.errors.unsetModsPath"));

      modsEventBus.emitProgressUpdated(
        t("mods.modOrderTab.progress.copyingFile"),
      );

      const fileContents =
        await Mods.actions.tempFolder.createFromFileOrArchive(
          modsPath,
          filePath,
        );

      const basename = await path.basename(filePath);
      const modDetails = {
        ...createBaseManagedMod(basename),
        ...partialModDetails,
      };

      const rootFolder =
        await Mods.actions.tempFolder.detectRootFolder(tmpPath);
      modDetails.options.rootFolder = rootFolder;

      modsEventBus.emitProgressFinished();

      openInstallModal(modDetails, fileContents);
    } catch (error) {
      modsEventBus.emitProgressAborted(error as AnyError);
    }
  };

  /**
   * Copy files and folders into temporary directory.
   * Automatically selects appropriate function:
   * - If a single file is passed and the file is an archive, attempts to extract it.
   * - If a single folder is passed, copies it's content.
   * - Otherwise copies all files and folders, not extracting anything.
   */
  const installFromPaths = async (
    filePaths: string[],
    partialModDetails: Partial<ManagedMod>,
  ) => {
    try {
      const modsPath = useProfilesStore.getState().getModsPath();
      const tmpPath = useProfilesStore.getState().getModsTmpPath();
      if (!modsPath || !tmpPath)
        throw new Error(t("mods.errors.unsetModsPath"));

      modsEventBus.emitProgressUpdated(
        t("mods.modOrderTab.progress.copyingFiles"),
      );

      const isFile =
        filePaths.length == 1 && (await commands.isFile(filePaths[0]));
      const isDir =
        filePaths.length == 1 && (await commands.isDirectory(filePaths[0]));

      let fileContents;
      if (isFile) {
        console.log("installFromPaths got a single file path:", filePaths[0]);
        fileContents = await Mods.actions.tempFolder.createFromFileOrArchive(
          modsPath,
          filePaths[0],
        );
      } else if (isDir) {
        console.log("installFromPaths got a single folder path:", filePaths[0]);
        fileContents = await Mods.actions.tempFolder.createFromFolder(
          modsPath,
          filePaths[0],
        );
      } else {
        console.log("installFromPaths got multiple paths:", filePaths);
        fileContents = await Mods.actions.tempFolder.createFromFiles(
          modsPath,
          filePaths,
        );
      }

      const basename =
        filePaths.length === 1 ? await path.basename(filePaths[0]) : undefined;
      const modDetails = {
        ...createBaseManagedMod(basename),
        ...partialModDetails,
      };

      const rootFolder =
        await Mods.actions.tempFolder.detectRootFolder(tmpPath);
      modDetails.options.rootFolder = rootFolder;

      modsEventBus.emitProgressFinished();

      openInstallModal(modDetails, fileContents);
    } catch (error) {
      modsEventBus.emitProgressAborted(error as AnyError);
    }
  };

  /** Copy folder contents into temporary directory */
  const installFromFolder = async () => {
    try {
      const folderPath = await dialog.open({
        directory: true,
        multiple: false,
      });
      if (!folderPath) return;

      const modsPath = useProfilesStore.getState().getModsPath();
      const tmpPath = useProfilesStore.getState().getModsTmpPath();
      if (!modsPath || !tmpPath)
        throw new Error(t("mods.errors.unsetModsPath"));

      modsEventBus.emitProgressUpdated(
        t("mods.modOrderTab.progress.copyingFolderContents"),
      );

      const fileContents = await Mods.actions.tempFolder.createFromFolder(
        modsPath,
        folderPath,
      );

      const basename = await path.basename(folderPath);
      const modDetails = createBaseManagedMod(basename);

      const rootFolder =
        await Mods.actions.tempFolder.detectRootFolder(tmpPath);
      modDetails.options.rootFolder = rootFolder;

      modsEventBus.emitProgressFinished();

      openInstallModal(modDetails, fileContents);
    } catch (error) {
      modsEventBus.emitProgressAborted(error as AnyError);
    }
  };

  /** Create mod from contents of temporary directory and entered mod details */
  const installMod = async (
    modDetails: ManagedMod,
    selectedPaths: string[],
  ) => {
    try {
      closeInstallModal();

      const modsPath = useProfilesStore.getState().getModsPath();
      if (!modsPath) throw new Error(t("mods.errors.unsetModsPath"));

      modsEventBus.emitProgressUpdated(
        t("mods.modOrderTab.progress.installingMod"),
      );

      const managedMods = useModsStore.getState().getManagedMods();
      const update = await Mods.actions.installation.installFromTempFolder(
        managedMods,
        modsPath,
        modDetails,
        selectedPaths,
      );
      updateModsStore(update);

      modsEventBus.emitProgressFinished();
      useToastsStore
        .getState()
        .addToast(t("mods.modOrderTab.toasts.modInstalled"), modDetails.title);
    } catch (error) {
      modsEventBus.emitProgressAborted(error as AnyError);
      useToastsStore
        .getState()
        .addToast(
          t("mods.modOrderTab.toasts.modInstallFailed"),
          t("common.error") + ": " + commandErrorToString(error as AnyError),
          "danger",
        );
    }
  };

  /** Delete the temporary directory to clean up */
  const abortInstallation = async () => {
    try {
      closeInstallModal();

      const modsPath = useProfilesStore.getState().getModsPath();
      if (!modsPath) throw new Error(t("mods.errors.unsetModsPath"));

      modsEventBus.emitProgressUpdated(
        t("mods.modOrderTab.progress.cleaningUp"),
      );

      await Mods.actions.tempFolder.delete(modsPath);

      modsEventBus.emitProgressFinished();
    } catch (error) {
      modsEventBus.emitProgressAborted(error as AnyError);
    }
  };

  return {
    installFromFile,
    installFromFileWithPath,
    installFromPaths,
    installFromFolder,
    installMod,
    modalProps: {
      onInstall: installMod,
      onAbort: abortInstallation,
      mod,
      show: showModal,
      fileContents,
    },
  };
}
