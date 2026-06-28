import { ManagedMod } from "@/commands/bindings";
import { AnyError } from "@/commands/errors";
import mitt from "mitt";

export type UIActionEvent =
  | { type: "mods-install-from-file" }
  | {
      type: "mods-install-from-file-with-path";
      path: string;
      details: Partial<ManagedMod>;
    }
  | {
      type: "mods-install-from-paths";
      paths: string[];
      details: Partial<ManagedMod>;
    }
  | { type: "mods-install-from-folder" }
  | { type: "mods-deploy" }
  | { type: "mods-global-enabled-changed"; enabled: boolean }
  | { type: "mods-delete-mod"; key: string }
  | { type: "mods-import-installed-archives" }
  | { type: "mods-show-conflicting-files" }
  | { type: "nexus-mods-check-for-updates" }
  | { type: "nexus-mods-download-mods-info" }
  | { type: "nexus-mods-endorse-all-mods" }
  | { type: "nexus-mods-download-mod-info"; key: string }
  | { type: "nexus-mods-endorse-mod"; key: string }
  | { type: "nexus-mods-abstain-mod"; key: string }
  | { type: "nexus-mods-not-logged-in" }
  | { type: "archive2-open" }
  | { type: "archive2-pick-file-explore-ba2-archive" }
  | { type: "archive2-pick-file-extract-ba2-archive" }
  | { type: "archive2-pick-create-ba2-archive" }
  | { type: "archive2-pick-file-display-info-ba2-archive" }
  | { type: "archive2-auto-pack-into-archives" }
  | { type: "resourcelist-add-archive" }
  | { type: "resourcelist-add-unlisted-archives" }
  | { type: "resourcelist-remove-non-existant-archives" }
  | { type: "resourcelist-add-game-voices-archives" }
  | { type: "resourcelist-remove-game-archives" }
  | { type: "resourcelist-remove-archive"; name: string };

export type ProgressEvent =
  | { type: "is-loading"; text: string; percent?: number }
  | { type: "has-finished" }
  | { type: "error"; error: AnyError };

export type Archive2Event = { type: "show-error-modal"; error: AnyError };

export type Events = {
  uiAction: UIActionEvent;
  progress: ProgressEvent;
  archive2: Archive2Event;
};

export class ModsEventBus {
  private emitter = mitt<Events>();

  private logEvent(
    type: string,
    event: UIActionEvent | ProgressEvent | Archive2Event,
  ): void {
    console.log(`[ModsEventBus:${type}] Event sent:`, event);
  }

  emitUIActionEvent(event: UIActionEvent): void {
    this.emitter.emit("uiAction", event);
    this.logEvent("uiAction", event);
  }

  onUIActionEvent(callback: (event: UIActionEvent) => void): () => void {
    this.emitter.on("uiAction", callback);
    return () => this.emitter.off("uiAction", callback);
  }

  /* Opens or updates the loading/progress modal. */
  emitProgressUpdated(text: string, percent?: number): void {
    const event: ProgressEvent = { type: "is-loading", text, percent };
    this.emitter.emit("progress", event);
    this.logEvent("progress", event);
  }

  /* Closes the loading/progress modal. */
  emitProgressFinished(): void {
    const event: ProgressEvent = { type: "has-finished" };
    this.emitter.emit("progress", event);
    this.logEvent("progress", event);
  }

  /* Opens or updates the error modal. Automatically closes the loading/progress modal. */
  emitProgressAborted(error: AnyError): void {
    const event: ProgressEvent = { type: "error", error };
    this.emitter.emit("progress", event);
    this.logEvent("progress", event);
  }

  /** Subscribe to listen to progress of operations in the ModOrder tab. */
  onProgressEvent(callback: (event: ProgressEvent) => void): () => void {
    this.emitter.on("progress", callback);
    return () => this.emitter.off("progress", callback);
  }

  emitArchive2Event(event: Archive2Event): void {
    this.emitter.emit("archive2", event);
    this.logEvent("archive2", event);
  }

  onArchive2Event(callback: (event: Archive2Event) => void): () => void {
    this.emitter.on("archive2", callback);
    return () => this.emitter.off("archive2", callback);
  }

  /* Starts the "install mod from file" flow. */
  emitInstallModFromFile() {
    this.emitUIActionEvent({ type: "mods-install-from-file" });
  }

  /* Starts the "install mod from file" flow and skips the file picker dialog. */
  emitInstallModFromFileWithPath(path: string, details: Partial<ManagedMod>) {
    this.emitUIActionEvent({
      type: "mods-install-from-file-with-path",
      path,
      details,
    });
  }

  /* Starts the mod installation flow and skips the file picker dialog. */
  emitInstallModFromPaths(paths: string[], details: Partial<ManagedMod>) {
    this.emitUIActionEvent({
      type: "mods-install-from-paths",
      paths,
      details,
    });
  }

  /* Starts the "install mod from folder" flow. */
  emitInstallModFromFolder() {
    this.emitUIActionEvent({ type: "mods-install-from-folder" });
  }

  /* Starts the deployment of mods. */
  emitDeployMods() {
    this.emitUIActionEvent({ type: "mods-deploy" });
  }

  /* Enable or disable mods globally. */
  emitChangeModsEnabled(enabled: boolean) {
    this.emitUIActionEvent({ type: "mods-global-enabled-changed", enabled });
  }

  /* Opens the modal asking if the user is sure they want to delete them mod. */
  emitDeleteMod(key: string) {
    this.emitUIActionEvent({ type: "mods-delete-mod", key });
  }

  /* Imports all installed *.ba2 archives belonging to mods that are not managed by the mod manager. */
  emitImportInstalledArchives() {
    this.emitUIActionEvent({ type: "mods-import-installed-archives" });
  }

  /* Searches all mods for duplicate (= conflicting) files and shows an enumeration of these. */
  emitShowConflictingFiles() {
    this.emitUIActionEvent({ type: "mods-show-conflicting-files" });
  }

  /* Check installed mods for updates using the NexusMods API. */
  emitNexusModsCheckForUpdates() {
    this.emitUIActionEvent({ type: "nexus-mods-check-for-updates" });
  }

  /* Download mod information and preview images for all installed mods using the NexusMods API. */
  emitNexusModsDownloadModsInfo() {
    this.emitUIActionEvent({ type: "nexus-mods-download-mods-info" });
  }

  /* Download mod information and the preview image for a single mod using the NexusMods API. */
  emitNexusModsDownloadModInfo(key: string) {
    this.emitUIActionEvent({ type: "nexus-mods-download-mod-info", key });
  }

  /* Endorse all installed mods using the NexusMods API. */
  emitNexusModsEndorseAllMods() {
    this.emitUIActionEvent({ type: "nexus-mods-endorse-all-mods" });
  }

  /* Endorse a mod using the NexusMods API. */
  emitNexusModsEndorseMod(key: string) {
    this.emitUIActionEvent({ type: "nexus-mods-endorse-mod", key });
  }

  /* Abstain from endorsing a mod using the NexusMods API. */
  emitNexusModsAbstainMod(key: string) {
    this.emitUIActionEvent({ type: "nexus-mods-abstain-mod", key });
  }

  /* Open Archive2. */
  emitArchive2Open() {
    this.emitUIActionEvent({ type: "archive2-open" });
  }

  /* Lets the user pick a *.ba2 file to open in Archive2. */
  emitArchive2PickFileExploreBA2() {
    this.emitUIActionEvent({ type: "archive2-pick-file-explore-ba2-archive" });
  }

  /* Lets the user pick a *.ba2 file to extract with Archive2. */
  emitArchive2PickFileExtractBA2() {
    this.emitUIActionEvent({ type: "archive2-pick-file-extract-ba2-archive" });
  }

  /* Lets the user create an archive with Archive2. */
  emitArchive2CreateBA2() {
    this.emitUIActionEvent({ type: "archive2-pick-create-ba2-archive" });
  }

  /* Lets the user pick a *.ba2 file and shows some metadata. */
  emitArchive2PickFileAndDisplayMetadata() {
    this.emitUIActionEvent({
      type: "archive2-pick-file-display-info-ba2-archive",
    });
  }

  emitArchive2AutoPackIntoArchives() {
    this.emitUIActionEvent({
      type: "archive2-auto-pack-into-archives",
    });
  }

  emitResourcelistAddArchive() {
    this.emitUIActionEvent({ type: "resourcelist-add-archive" });
  }

  emitResourcelistAddUnlistedArchives() {
    this.emitUIActionEvent({ type: "resourcelist-add-unlisted-archives" });
  }

  emitResourcelistRemoveNonExistantArchives() {
    this.emitUIActionEvent({
      type: "resourcelist-remove-non-existant-archives",
    });
  }

  emitResourcelistAddGameVoicesArchives() {
    this.emitUIActionEvent({ type: "resourcelist-add-game-voices-archives" });
  }

  emitResourcelistRemoveGameArchives() {
    this.emitUIActionEvent({ type: "resourcelist-remove-game-archives" });
  }

  emitResourcelistRemoveArchive(name: string) {
    this.emitUIActionEvent({ type: "resourcelist-remove-archive", name });
  }
}

/**
 * Singleton instance for the entire application
 */
export const modsEventBus = new ModsEventBus();
