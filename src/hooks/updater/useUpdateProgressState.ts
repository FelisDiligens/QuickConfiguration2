import { updaterService } from "@/services/updater";
import { useSyncExternalStore } from "react";

/**
 * Get the state for update progress.
 */
export function useUpdateProgressState() {
  return useSyncExternalStore(
    (listener) =>
      updaterService.subscribe((type) => {
        if (type === "update") listener();
      }),
    () => updaterService.getUpdateState(),
  );
}
