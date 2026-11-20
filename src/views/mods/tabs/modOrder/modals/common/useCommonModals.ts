import ErrorMessageModal from "@/components/modals/ErrorMessageModal";
import LoadingModal, {
  LoadingModalData,
} from "@/components/modals/LoadingModal";
import { openModal } from "@/hooks/useModal";
import { modsEventBus } from "@/services/mods";
import { useModalStore } from "@/stores/modals";
import { useEffect, useRef } from "react";

export function useCommonModals() {
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

  // React to progress messages:
  useEffect(
    () =>
      modsEventBus.onProgressEvent((message) => {
        switch (message.type) {
          case "is-loading": {
            closeErrorModal();
            const data: LoadingModalData = {
              label: message.text,
              progress:
                message.percent != undefined
                  ? message.percent * 100
                  : undefined,
            };
            const id = loadingModalIdRef.current;
            if (
              id &&
              useModalStore.getState().stack.some((entry) => entry.id === id)
            ) {
              useModalStore.getState().updateById(id, data);
            } else {
              void openModal(LoadingModal, data);
              loadingModalIdRef.current = useModalStore
                .getState()
                .stack.at(-1)?.id;
            }
            break;
          }
          case "has-finished":
            closeLoadingModal();
            closeErrorModal();
            break;
          case "error":
            closeLoadingModal();
            void openModal(ErrorMessageModal, { reason: message.error });
            errorModalIdRef.current = useModalStore.getState().stack.at(-1)?.id;
            break;
          // no default
        }
      }),
    [],
  );
}
