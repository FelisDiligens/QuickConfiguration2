import { Archive2Compression, Archive2Format } from "@/commands/bindings";
import { AnyError } from "@/commands/errors";
import { ExtendedArchive2Info, useArchive2 } from "@/hooks/mods";
import { modsEventBus } from "@/services/mods";
import * as dialog from "@tauri-apps/plugin-dialog";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import {
  isArchive2AutoPackModalShownAtom,
  isArchive2CreateModalShownAtom,
  isArchive2ErrorModalShownAtom,
  isArchive2ExtractModalShownAtom,
  isArchive2InfoModalShownAtom,
} from "..";
import Archive2AutoPackModal from "./Archive2AutoPackModal";
import Archive2CreateModal from "./Archive2CreateModal";
import Archive2ErrorModal from "./Archive2ErrorModal";
import Archive2ExtractModal from "./Archive2ExtractModal";
import Archive2InfoModal from "./Archive2InfoModal";

function useInfoModal() {
  const [info, setInfo] = useState<ExtendedArchive2Info | null>(null);
  const [show, setShow] = useAtom(isArchive2InfoModalShownAtom);

  function showModal(info: ExtendedArchive2Info) {
    setInfo(info);
    setShow(true);
  }

  return {
    showModal,
    props: {
      show,
      onHide: () => setShow(false),
      info,
    },
  };
}

function useCreateModal() {
  const [show, setShow] = useAtom(isArchive2CreateModalShownAtom);
  const { createArchive } = useArchive2();
  return {
    showModal: () => setShow(true),
    props: {
      show,
      onHide: () => setShow(false),
      onCreate: (
        archivePath: string,
        sourcePath: string,
        format: Archive2Format,
        compression: Archive2Compression,
      ) => {
        setShow(false);
        createArchive(archivePath, sourcePath, format, compression).catch(
          console.error,
        );
      },
    },
  };
}

function useExtractModal() {
  const [show, setShow] = useAtom(isArchive2ExtractModalShownAtom);
  const { extractArchive } = useArchive2();
  return {
    showModal: () => setShow(true),
    props: {
      show,
      onHide: () => setShow(false),
      onExtract: (archivePath: string, destinationPath: string) => {
        setShow(false);
        extractArchive(archivePath, destinationPath).catch(console.error);
      },
    },
  };
}

function useAutoPackModal() {
  const [show, setShow] = useAtom(isArchive2AutoPackModalShownAtom);
  const { autoPackBa2Archives } = useArchive2();
  return {
    showModal: () => setShow(true),
    props: {
      show,
      onHide: () => setShow(false),
      onCreate: (
        modName: string,
        sourcePath: string,
        destinationPath: string,
        tempPath: string,
      ) => {
        setShow(false);
        autoPackBa2Archives(
          modName,
          sourcePath,
          destinationPath,
          tempPath,
        ).catch(console.error);
      },
    },
  };
}

function useErrorModal() {
  const [show, setShow] = useAtom(isArchive2ErrorModalShownAtom);
  const [error, setError] = useState<AnyError>(null);
  return {
    showModal: (error: AnyError) => {
      setError(error);
      setShow(true);
    },
    props: {
      show,
      onHide: () => setShow(false),
      reason: error,
    },
  };
}

export default function Archive2Modals() {
  const { openArchive2, exploreArchive, readArchive2Info } = useArchive2();

  const { showModal: showInfoModal, props: infoModalProps } = useInfoModal();
  const { showModal: showCreateModal, props: createModalProps } =
    useCreateModal();
  const { showModal: showExtractModal, props: extractModalProps } =
    useExtractModal();
  const { showModal: showAutoPackModal, props: autoPackModalProps } =
    useAutoPackModal();
  const { showModal: showErrorModal, props: errorModalProps } = useErrorModal();

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
      if (info) showInfoModal(info);
    } catch (reason) {
      console.error(reason);
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
            showExtractModal();
            break;
          case "archive2-pick-create-ba2-archive":
            showCreateModal();
            break;
          case "archive2-auto-pack-into-archives":
            showAutoPackModal();
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
            showErrorModal(message.error);
            break;
        }
      }),
    [],
  );

  return (
    <>
      <Archive2InfoModal {...infoModalProps} />
      <Archive2CreateModal {...createModalProps} />
      <Archive2ExtractModal {...extractModalProps} />
      <Archive2AutoPackModal {...autoPackModalProps} />
      <Archive2ErrorModal {...errorModalProps} />
    </>
  );
}
