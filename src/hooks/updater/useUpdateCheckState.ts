import { updaterService } from "@/services/updater";
import { useSyncExternalStore } from "react";

/**
 * Get the state for update checks.
 */
export function useUpdateCheckState() {
  return useSyncExternalStore(
    (listener) =>
      updaterService.subscribe((type) => {
        if (type === "check") listener();
      }),
    () => updaterService.getCheckState(),
  );
}
