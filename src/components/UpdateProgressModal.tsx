import { AnyError } from "@/commands/errors";
import ErrorMessageModal from "@/components/modals/ErrorMessageModal";
import LoadingModal from "@/components/modals/LoadingModal";
import { updaterService } from "@/services/updater";
import { formatBytes } from "@/utils";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

function useLoadingModal() {
  const [show, setShow] = useState(false);
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
  const [show, setShow] = useState(false);
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

/**
 * When an update is started (`updaterService.downloadAndInstall()`),
 * then a loading modal is shown that blocks the UI.
 * If it fails, it shows an error modal.
 */
export default function UpdateProgressModal() {
  const { t } = useTranslation();
  const {
    showProgress,
    hideProgress,
    modalProps: loadingModalProps,
  } = useLoadingModal();
  const { showError, hideError, modalProps: errorModalProps } = useErrorModal();

  // React to messages:
  useEffect(() => {
    return updaterService.subscribe((type) => {
      if (type !== "update") return;
      const { isPending, error, contentLength, downloadedBytes, percent } =
        updaterService.getUpdateState();
      if (isPending) {
        showProgress(
          t("updates.download.text", {
            downloaded: formatBytes(downloadedBytes || 0),
            total: formatBytes(contentLength || 0),
            // percent: (percent || 0) * 100,
          }),
          (percent || 0) * 100,
        );
        hideError();
      } else if (error) {
        hideProgress();
        showError(error);
      } else {
        hideProgress();
        hideError();
      }
    });
  }, []);

  return (
    <>
      <LoadingModal {...loadingModalProps} />
      <ErrorMessageModal {...errorModalProps} />
    </>
  );
}
