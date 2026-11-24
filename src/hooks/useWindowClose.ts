import { windowCloseService } from "@/services/windowCloseService";
import { DependencyList, useEffect } from "react";

export default function useWindowClose(
  onWindowClose: () => undefined | Promise<void> | Promise<null>,
  deps: DependencyList,
  priority?: number,
) {
  useEffect(() => windowCloseService.subscribe(onWindowClose, priority), deps);
}
