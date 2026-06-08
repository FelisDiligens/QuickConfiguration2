import { commandErrorToString } from "@/commands/errors";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

export class WindowCloseService {
  private static readonly appWindow = getCurrentWebviewWindow();
  private subscriber = new Set<() => Promise<void> | Promise<null>>();

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
   * @param listener - Callback function invoked on the window close requested event.
   * @returns A function to unsubscribe
   */
  public subscribe(listener: () => Promise<void> | Promise<null>) {
    this.subscriber.add(listener);
    return () => {
      this.subscriber.delete(listener);
    };
  }

  private async emit() {
    const results = await Promise.allSettled(
      Array.from(this.subscriber).map((listener) => listener()),
    );
    results
      .filter((result) => result.status === "rejected")
      .map((result) => console.error(result.reason));
  }
}

export const windowCloseService = new WindowCloseService();
