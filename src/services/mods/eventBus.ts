import { ManagedMod } from "@/commands/bindings";
import mitt from "mitt";

export type UIModsActionEvent =
  | { type: "mods-install-from-file" }
  | {
      type: "mods-install-from-file-with-path";
      path: string;
      details: Partial<ManagedMod>;
      updateModKey?: string;
    }
  | {
      type: "mods-install-from-paths";
      paths: string[];
      details: Partial<ManagedMod>;
    }
  | { type: "mods-install-from-folder" }
  | { type: "mods-deploy" }
  | { type: "mods-delete-mod"; key: string }
  | { type: "mods-import-installed-archives" }
  | { type: "mods-show-conflicting-files" }
  | { type: "nexus-mods-check-for-updates" }
  | { type: "nexus-mods-update-mod"; key: string }
  | { type: "nexus-mods-download-mods-info" }
  | { type: "nexus-mods-endorse-all-mods" }
  | { type: "nexus-mods-download-mod-info"; key: string }
  | { type: "nexus-mods-endorse-mod"; key: string }
  | { type: "nexus-mods-abstain-mod"; key: string }
  | { type: "nexus-mods-not-logged-in" }
  | { type: "nexus-mods-track-mod-file"; key: string }
  | { type: "archive2-open" }
  | { type: "archive2-pick-file-explore-ba2-archive" }
  | { type: "archive2-pick-file-extract-ba2-archive" }
  | { type: "archive2-pick-create-ba2-archive" }
  | { type: "archive2-pick-file-display-info-ba2-archive" }
  | { type: "archive2-auto-pack-into-archives" };

export type UIResourcesActionEvent =
  | { type: "resourcelist-add-archive" }
  | { type: "resourcelist-add-unlisted-archives" }
  | { type: "resourcelist-remove-non-existant-archives" }
  | { type: "resourcelist-remove-game-archives" }
  | { type: "resourcelist-remove-archive"; name: string };

/* eslint-disable-next-line @typescript-eslint/consistent-type-definitions --
 * `Events` needs to "satisfy the constraint 'Record<EventType, unknown>'"
 * otherwise it cannot be used with mitt.
 */
export type Events = {
  mods: UIModsActionEvent;
  resources: UIResourcesActionEvent;
};

export class ModsEventBus {
  private emitter = mitt<Events>();

  private logEvent(
    type: string,
    event: UIModsActionEvent | UIResourcesActionEvent,
  ): void {
    console.log(`[ModsEventBus:${type}] Event sent:`, event);
  }

  emitModsEvent(event: UIModsActionEvent): void {
    this.emitter.emit("mods", event);
    this.logEvent("mods", event);
  }

  onModsEvent(callback: (event: UIModsActionEvent) => void): () => void {
    this.emitter.on("mods", callback);
    return () => this.emitter.off("mods", callback);
  }

  emitResourcesEvent(event: UIResourcesActionEvent): void {
    this.emitter.emit("resources", event);
    this.logEvent("resources", event);
  }

  onResourcesEvent(
    callback: (event: UIResourcesActionEvent) => void,
  ): () => void {
    this.emitter.on("resources", callback);
    return () => this.emitter.off("resources", callback);
  }

  /* Starts the "install mod from file" flow. */
  emitInstallModFromFile() {
    this.emitModsEvent({ type: "mods-install-from-file" });
  }

  /* Starts the "install mod from file" flow and skips the file picker dialog. */
  emitInstallModFromFileWithPath(
    path: string,
    details: Partial<ManagedMod>,
    updateModKey?: string,
  ) {
    this.emitModsEvent({
      type: "mods-install-from-file-with-path",
      path,
      details,
      updateModKey,
    });
  }

  /* Starts the mod installation flow and skips the file picker dialog. */
  emitInstallModFromPaths(paths: string[], details: Partial<ManagedMod>) {
    this.emitModsEvent({
      type: "mods-install-from-paths",
      paths,
      details,
    });
  }

  /* Starts the "install mod from folder" flow. */
  emitInstallModFromFolder() {
    this.emitModsEvent({ type: "mods-install-from-folder" });
  }

  /* Starts the deployment of mods. */
  emitDeployMods() {
    this.emitModsEvent({ type: "mods-deploy" });
  }

  /* Opens the modal asking if the user is sure they want to delete them mod. */
  emitDeleteMod(key: string) {
    this.emitModsEvent({ type: "mods-delete-mod", key });
  }

  /* Imports all installed *.ba2 archives belonging to mods that are not managed by the mod manager. */
  emitImportInstalledArchives() {
    this.emitModsEvent({ type: "mods-import-installed-archives" });
  }

  /* Searches all mods for duplicate (= conflicting) files and shows an enumeration of these. */
  emitShowConflictingFiles() {
    this.emitModsEvent({ type: "mods-show-conflicting-files" });
  }

  /* Check installed mods for updates using the NexusMods API. */
  emitNexusModsCheckForUpdates() {
    this.emitModsEvent({ type: "nexus-mods-check-for-updates" });
  }

  /* Update a single installed mod using the NexusMods API (or the browser as fallback). */
  emitNexusModsUpdateMod(key: string) {
    this.emitModsEvent({ type: "nexus-mods-update-mod", key });
  }

  /* Download mod information and preview images for all installed mods using the NexusMods API. */
  emitNexusModsDownloadModsInfo() {
    this.emitModsEvent({ type: "nexus-mods-download-mods-info" });
  }

  /* Download mod information and the preview image for a single mod using the NexusMods API. */
  emitNexusModsDownloadModInfo(key: string) {
    this.emitModsEvent({ type: "nexus-mods-download-mod-info", key });
  }

  /* Endorse all installed mods using the NexusMods API. */
  emitNexusModsEndorseAllMods() {
    this.emitModsEvent({ type: "nexus-mods-endorse-all-mods" });
  }

  /* Endorse a mod using the NexusMods API. */
  emitNexusModsEndorseMod(key: string) {
    this.emitModsEvent({ type: "nexus-mods-endorse-mod", key });
  }

  /* Abstain from endorsing a mod using the NexusMods API. */
  emitNexusModsAbstainMod(key: string) {
    this.emitModsEvent({ type: "nexus-mods-abstain-mod", key });
  }

  /* Start the flow to track a NexusMods file for a mod. */
  emitNexusModsTrackModFile(key: string) {
    this.emitModsEvent({ type: "nexus-mods-track-mod-file", key });
  }

  /* Open Archive2. */
  emitArchive2Open() {
    this.emitModsEvent({ type: "archive2-open" });
  }

  /* Lets the user pick a *.ba2 file to open in Archive2. */
  emitArchive2PickFileExploreBA2() {
    this.emitModsEvent({ type: "archive2-pick-file-explore-ba2-archive" });
  }

  /* Lets the user pick a *.ba2 file to extract with Archive2. */
  emitArchive2PickFileExtractBA2() {
    this.emitModsEvent({ type: "archive2-pick-file-extract-ba2-archive" });
  }

  /* Lets the user create an archive with Archive2. */
  emitArchive2CreateBA2() {
    this.emitModsEvent({ type: "archive2-pick-create-ba2-archive" });
  }

  /* Lets the user pick a *.ba2 file and shows some metadata. */
  emitArchive2PickFileAndDisplayMetadata() {
    this.emitModsEvent({
      type: "archive2-pick-file-display-info-ba2-archive",
    });
  }

  emitArchive2AutoPackIntoArchives() {
    this.emitModsEvent({
      type: "archive2-auto-pack-into-archives",
    });
  }

  emitResourcelistAddArchive() {
    this.emitResourcesEvent({ type: "resourcelist-add-archive" });
  }

  emitResourcelistAddUnlistedArchives() {
    this.emitResourcesEvent({ type: "resourcelist-add-unlisted-archives" });
  }

  emitResourcelistRemoveNonExistantArchives() {
    this.emitResourcesEvent({
      type: "resourcelist-remove-non-existant-archives",
    });
  }

  emitResourcelistRemoveGameArchives() {
    this.emitResourcesEvent({ type: "resourcelist-remove-game-archives" });
  }

  emitResourcelistRemoveArchive(name: string) {
    this.emitResourcesEvent({ type: "resourcelist-remove-archive", name });
  }
}

/**
 * Singleton instance for the entire application
 */
export const modsEventBus = new ModsEventBus();
