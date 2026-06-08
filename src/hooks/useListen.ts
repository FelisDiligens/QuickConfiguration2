import { EventCallback, EventName, UnlistenFn } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useEffect } from "react";

const appWindow = getCurrentWebviewWindow();

interface SpectaEvent<T> {
  listen: (cb: EventCallback<T>) => Promise<UnlistenFn>;
  name: string;
}

/**
 * Listen to an event emitted by the backend or webview. The event must either be a global event or an event targetting this window.
 * Automatically removes event handler on component unmount.
 * @param event {EventName} Event name.
 * @param handler {EventCallback} Event handler.
 */
export default function useListen<T>(
  event: EventName | SpectaEvent<T>,
  handler: EventCallback<T>,
) {
  const isEventName = typeof event === "string";
  const listen = isEventName
    ? (handler: EventCallback<T>) =>
        appWindow.listen(event as EventName, handler)
    : (handler: EventCallback<T>) => (event as SpectaEvent<T>).listen(handler);
  const name = isEventName ? (event as string) : (event as SpectaEvent<T>).name;

  useEffect(() => {
    const unlistenPromise = listen(handler).catch((reason) => {
      console.error(`[useListen] Listening to "${name}" failed: ${reason}`);
      throw reason;
    });
    return () => {
      unlistenPromise.then((unlisten) => unlisten()).catch(console.error);
    };
  }, []);
}
