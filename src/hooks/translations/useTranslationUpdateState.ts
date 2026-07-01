import { translationUpdateService } from "@/services/translations";
import { useSyncExternalStore } from "react";

/**
 * Get the state for translation updates.
 */
export function useTranslationUpdateState() {
  return useSyncExternalStore(
    (listener) =>
      translationUpdateService.subscribe((type) => {
        if (type === "update") listener();
      }),
    () => translationUpdateService.getUpdateState(),
  );
}
