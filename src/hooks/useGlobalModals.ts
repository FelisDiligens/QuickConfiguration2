import { commands } from "@/commands/bindings";
import ErrorMessageModal from "@/components/modals/ErrorMessageModal";
import FirstRunModal from "@/components/modals/FirstRunModal";
import LoadingModal, {
  LoadingModalData,
} from "@/components/modals/LoadingModal";
import PrereleaseModal from "@/components/modals/PrereleaseModal";
import { useAsync } from "@/hooks/async";
import { openModal } from "@/hooks/useModal";
import { updaterService } from "@/services/updater";
import { useProfilesStore } from "@/stores/profiles";
import { useSettingsStore } from "@/stores/settings";
import { useModalStore } from "@/stores/modals";
import { formatBytes } from "@/utils";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

function useFirstRunModal() {
  const profiles = useProfilesStore((store) => store.profiles);
  const isFirstRun = profiles.length == 0;
  const { data: isPrerelease } = useAsync(commands.isPrerelease);
  const isPrereleaseDismissed = useSettingsStore((s) => s.prereleaseDismissed);
  const isOpenRef = useRef(false);

  // Open the first run modal if no profiles are available and the prerelease
  // modal isn't shown (wait until the prerelease check has resolved, so the
  // first run modal doesn't flash before the prerelease modal):
  useEffect(() => {
    if (
      isFirstRun &&
      isPrerelease !== undefined &&
      !(isPrerelease && !isPrereleaseDismissed) &&
      !isOpenRef.current
    ) {
      isOpenRef.current = true;
      void openModal(FirstRunModal, undefined).finally(() => {
        isOpenRef.current = false;
      });
    }
  }, [isFirstRun, isPrerelease, isPrereleaseDismissed]);
}

function usePrereleaseModal() {
  const { data: isPrerelease } = useAsync(commands.isPrerelease);
  const isDismissed = useSettingsStore((s) => s.prereleaseDismissed);
  const isOpenRef = useRef(false);

  useEffect(() => {
    if (isPrerelease && !isDismissed && !isOpenRef.current) {
      isOpenRef.current = true;
      void openModal(PrereleaseModal, undefined).finally(() => {
        isOpenRef.current = false;
      });
    }
  }, [isPrerelease, isDismissed]);
}

function useUpdateProgressModal() {
  const { t } = useTranslation();
  const loadingModalIdRef = useRef<string | undefined>(undefined);
  const errorModalIdRef = useRef<string | undefined>(undefined);

  const closeLoadingModal = () => {
    const id = loadingModalIdRef.current;
    if (id) {
      useModalStore.getState().closeById(id);
      loadingModalIdRef.current = undefined;
    }
  };

  const closeErrorModal = () => {
    const id = errorModalIdRef.current;
    if (id) {
      useModalStore.getState().closeById(id);
      errorModalIdRef.current = undefined;
    }
  };

  // React to update progress:
  useEffect(
    () =>
      updaterService.subscribe((type) => {
        if (type !== "update") return;
        const { isPending, error, contentLength, downloadedBytes, percent } =
          updaterService.getUpdateState();
        if (isPending) {
          closeErrorModal();
          const data: LoadingModalData = {
            label: t("updates.download.text", {
              downloaded: formatBytes(downloadedBytes || 0),
              total: formatBytes(contentLength || 0),
            }),
            progress: (percent || 0) * 100,
          };
          const id = loadingModalIdRef.current;
          if (id && useModalStore.getState().has(id)) {
            useModalStore.getState().updateById(id, data);
          } else {
            void openModal(LoadingModal, data);
            loadingModalIdRef.current = useModalStore.getState().getCurrentId();
          }
        } else if (error) {
          closeLoadingModal();
          void openModal(ErrorMessageModal, { reason: error });
          errorModalIdRef.current = useModalStore.getState().getCurrentId();
        } else {
          closeLoadingModal();
          closeErrorModal();
        }
      }),
    [],
  );
}

/**
 * Opens the global, self-showing modals (first run, prerelease notice, update
 * progress) on the modal stack when their condition becomes true. Mount once
 * near the app root (in `Layout.tsx` → `Globals`).
 */
export function useGlobalModals() {
  useFirstRunModal();
  usePrereleaseModal();
  useUpdateProgressModal();
}
