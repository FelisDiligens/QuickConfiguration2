import { commandErrorToString } from "@/commands/errors";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

const DEFAULT_PRIORITY = 0;

export interface WindowCloseSubscriber {
  callback: () => undefined | Promise<void> | Promise<null>;
  priority: number;
}

export class WindowCloseService {
  private static readonly appWindow = getCurrentWebviewWindow();
  private subscriber = new Set<WindowCloseSubscriber>();

  constructor() {
    if (WindowCloseService.appWindow.label !== "main") return;
    WindowCloseService.appWindow
      .onCloseRequested(async (_event) => {
        await this.emit();
        console.log("[WindowCloseService] Close imminent, good bye.");
      })
      .catch((error) => {
        console.error(
          "[WindowCloseService] Cannot listen to close requested event:",
          commandErrorToString(error),
        );
      });
  }

  /**
   * Subscribes to the window close requested event.
   * It waits for the Promise to be settled before the window closes,
   * this gives the callee a chance to cleanup or persist resources.
   *
   * @param callback - Callback function invoked on the window close requested event.
   * @param priority - Determines the invocation order: higher priority callbacks are invoked
   *   earlier. All callbacks are invoked concurrently; the close waits until all of them settle.
   * @returns A function to unsubscribe
   */
  public subscribe(
    callback: WindowCloseSubscriber["callback"],
    priority?: WindowCloseSubscriber["priority"],
  ) {
    const listener = { callback, priority: priority ?? DEFAULT_PRIORITY };
    this.subscriber.add(listener);
    return () => {
      this.subscriber.delete(listener);
    };
  }

  private async emit() {
    const results = await Promise.allSettled(
      Array.from(this.subscriber)
        .sort((a, b) => b.priority - a.priority)
        .map((listener) => listener.callback()),
    );
    results
      .filter((result) => result.status === "rejected")
      .map((result) => console.error(result.reason));
  }
}

export const windowCloseService = new WindowCloseService();
