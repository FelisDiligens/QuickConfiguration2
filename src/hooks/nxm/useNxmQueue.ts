import { nxmLinksQueueService } from "@/services/nxm";
import { useSyncExternalStore } from "react";

/**
 * Get the first nxm:// url from the queue that was opened.
 */
export function useNxmQueue() {
  return useSyncExternalStore(
    (listener) => nxmLinksQueueService.subscribe(listener),
    () => nxmLinksQueueService.peek(),
  );
}
