import { AnyError, commandErrorToString } from "@/commands/errors";
import * as process from "@tauri-apps/plugin-process";
import * as updater from "@tauri-apps/plugin-updater";
import { type Update } from "@tauri-apps/plugin-updater";

interface CheckState {
  version?: string | undefined;
  isPending: boolean;
  error: AnyError;
}

interface UpdateState {
  isPending: boolean;
  error: AnyError;
  state?: "Started" | "Progress" | "Finished" | undefined;
  contentLength?: number | undefined;
  downloadedBytes?: number | undefined;
  percent?: number | undefined;
}

export class UpdaterService {
  private update: Update | null = null;
  private subscriber = new Set<(type: "check" | "update") => void>();
  private checkState: CheckState = {
    isPending: false,
    error: null,
  };
  private updateState: UpdateState = {
    isPending: false,
    error: null,
  };

  public async check() {
    if (this.checkState.isPending) return;
    console.log("[UpdaterService] Checking for update...");
    this.update = null;
    this.checkState = {
      isPending: true,
      error: null,
    };
    this.emit("check");
    try {
      const update = await updater.check();
      if (update) console.log("[UpdaterService] Update found:", update.version);
      else console.log("[UpdaterService] No update found");
      this.update = update;
      this.checkState = {
        version: update?.version,
        isPending: false,
        error: null,
      };
      this.emit("check");
      return update;
    } catch (error) {
      console.log(
        "[UpdaterService] Error:",
        commandErrorToString(error as AnyError),
      );
      this.update = null;
      this.checkState = {
        isPending: false,
        error: error as AnyError,
      };
      this.emit("check");
      throw error;
    }
  }

  public async downloadAndInstall(relaunch = true) {
    if (this.updateState.isPending) return;
    console.log("[UpdaterService] Downloading and installing update...");
    this.updateState = {
      isPending: true,
      error: null,
    };
    this.emit("update");
    try {
      if (!this.update) throw new Error("this.update is null");
      await this.update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            this.updateState = {
              ...this.updateState,
              state: event.event,
              contentLength: event.data.contentLength,
            };
            this.emit("update");
            console.log(
              `[UpdaterService] Started downloading ${event.data.contentLength} bytes`,
            );
            break;
          case "Progress":
            this.updateState = {
              ...this.updateState,
              state: event.event,
              downloadedBytes:
                (this.updateState.downloadedBytes || 0) +
                event.data.chunkLength,
              percent: this.updateState.contentLength
                ? (this.updateState.downloadedBytes || 0) /
                  this.updateState.contentLength
                : 0,
            };
            this.emit("update");
            console.log(
              `[UpdaterService] Downloaded ${this.updateState.downloadedBytes} from ${this.updateState.contentLength}: ${(this.updateState.percent || 0) * 100}%`,
            );
            break;
          case "Finished":
            this.updateState = {
              ...this.updateState,
              state: event.event,
            };
            console.log("[UpdaterService] Download finished");
            break;
        }
      });
      console.log("[UpdaterService] Update installed, relaunching...");
      if (relaunch) await process.relaunch();
    } catch (error) {
      console.log(
        "[UpdaterService] Error:",
        commandErrorToString(error as AnyError),
      );
      this.updateState = {
        isPending: false,
        error: error as AnyError,
      };
      this.emit("update");
      throw error;
    }
  }

  /**
   * Subscribes to update checks and download&install progress.
   *
   * @param listener - Callback function invoked when checkState or updateState change.
   * @returns A function to unsubscribe
   */
  public subscribe(listener: (type: "check" | "update") => void) {
    this.subscriber.add(listener);
    return () => {
      this.subscriber.delete(listener);
    };
  }

  private emit(type: "check" | "update") {
    this.subscriber.forEach((listener) => listener(type));
  }

  public getCheckState() {
    return this.checkState;
  }

  public getUpdateState() {
    return this.updateState;
  }
}

export const updaterService = new UpdaterService();
