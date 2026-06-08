import { commands, events } from "@/commands/bindings";
import { commandErrorToString } from "@/commands/errors";
import { UnlistenFn } from "@tauri-apps/api/event";

class NXMLinksQueueService {
  private current: string | null = null;
  private queue: string[] = [];
  private unlisten: Promise<UnlistenFn> | null = null;
  private subscriber = new Set<(link: string) => void>();

  constructor() {
    this.fetchCurrent();
    this.listenToNewLinks();
  }

  /** Peek at the next link in the queue. */
  public peek() {
    return this.queue.at(0);
  }

  /** Get the next link in the queue, thereby removing it from the queue. */
  public next() {
    return this.queue.shift();
  }

  /**
   * Subscribes to nxm:// links that are opened with the app.
   *
   * @param listener - Callback function invoked when new nxm:// links are received.
   * @param fireImmediately - If set to true (and at least one link in queue), will fire the event handler immediately.
   * @returns A function to unsubscribe
   */
  public subscribe(listener: (link: string) => void, fireImmediately = false) {
    this.subscriber.add(listener);

    const link = this.peek();
    if (fireImmediately && link) listener(link);

    return () => {
      this.subscriber.delete(listener);
    };
  }

  /** Add an nxm:// link to the queue. */
  private addToQueue(link: string | null) {
    if (link && !this.queue.includes(link)) {
      this.queue.push(link);
      Array.from(this.subscriber).map((listener) => listener(link));
    }
  }

  /** Get the nxm link the app was started with if it was. */
  private fetchCurrent() {
    if (this.current) return;
    commands
      .nxmGetCurrent()
      .then((link) => {
        if (link) console.log("Started app with nxm link:", link);
        this.current = link;
        this.addToQueue(link);
      })
      .catch((error) => {
        console.error(
          "Couldn't get current nxm link:",
          commandErrorToString(error),
        );
      });
  }

  /** Subscribe to the "nxm-new-link" event to add links to the queue. */
  private listenToNewLinks() {
    this.unlisten = events.nxmNewLink.listen((event) => {
      const link = event.payload;
      console.log("Got nxm link from event:", link);
      this.addToQueue(link);
    });
  }
}

export const nxmLinksQueueService = new NXMLinksQueueService();
