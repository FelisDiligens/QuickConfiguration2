import { translationUpdateService } from "@/services/translations";
import { useSyncExternalStore } from "react";

/**
 * Get the state for translation update checks.
 */
export function useTranslationUpdateCheckState() {
  return useSyncExternalStore(
    (listener) =>
      translationUpdateService.subscribe((type) => {
        if (type === "check") listener();
      }),
    () => translationUpdateService.getCheckState(),
  );
}
