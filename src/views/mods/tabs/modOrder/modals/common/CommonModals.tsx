import { AnyError } from "@/commands/errors";
import ErrorMessageModal from "@/components/modals/ErrorMessageModal";
import LoadingModal from "@/components/modals/LoadingModal";
import { modsEventBus } from "@/services/mods";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { isErrorModalShownAtom, isLoadingModalShownAtom } from "..";

function useLoadingModal() {
  const [show, setShow] = useAtom(isLoadingModalShownAtom);
  const [progress, setProgress] = useState<number | undefined>(undefined);
  const [label, setLabel] = useState<string>("");

  const showProgress = (text: string, progress?: number) => {
    setShow(true);
    setLabel(text);
    setProgress(progress);
  };

  const hideProgress = () => setShow(false);

  return {
    showProgress,
    hideProgress,
    modalProps: {
      show,
      progress,
      label,
    },
  };
}

function useErrorModal() {
  const [show, setShow] = useAtom(isErrorModalShownAtom);
  const [error, setError] = useState<AnyError>("");

  const showError = (error: AnyError) => {
    setShow(true);
    setError(error);
  };

  const hideError = () => setShow(false);

  return {
    showError,
    hideError,
    modalProps: {
      show,
      reason: error,
      onHide: hideError,
    },
  };
}

export default function CommonModals() {
  const {
    showProgress,
    hideProgress,
    modalProps: loadingModalProps,
  } = useLoadingModal();
  const { showError, hideError, modalProps: errorModalProps } = useErrorModal();

  // React to messages:
  useEffect(
    () =>
      modsEventBus.onProgressEvent((message) => {
        switch (message.type) {
          case "is-loading":
            showProgress(
              message.text,
              message.percent != undefined ? message.percent * 100 : undefined,
            );
            hideError();
            break;
          case "has-finished":
            hideProgress();
            hideError();
            break;
          case "error":
            hideProgress();
            showError(message.error);
            break;
        }
      }),
    [],
  );

  return (
    <>
      <LoadingModal {...loadingModalProps} />
      <ErrorMessageModal {...errorModalProps} />
    </>
  );
}
