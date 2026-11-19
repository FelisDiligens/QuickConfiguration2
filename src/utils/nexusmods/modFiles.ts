import { ManagedMod, NexusModsModFileInfo } from "@/commands/bindings";
import { Nullish } from "@/types";
import { NexusModsModFileIds, parseNexusModsUrl } from ".";

export class ModFilesMap {
  #map: Map<string, NexusModsModFileInfo>;

  /**
   * Builds a lookup map from game domain, game-scoped mod ID, and mod file to
   * the mod file info, so that looking up the info of many mods doesn't require
   * a linear search per mod.
   */
  constructor(
    modfiles?:
      Nullish<NexusModsModFileInfo[]> | Map<string, NexusModsModFileInfo>,
  ) {
    if (modfiles instanceof Map) {
      this.#map = modfiles;
    } else {
      this.#map = new Map(
        (modfiles ?? []).map((modinfo) => [
          ModFilesMap.#toKey(modinfo),
          modinfo,
        ]),
      );
    }
  }

  addOrUpdate(value: NexusModsModFileInfo) {
    this.#map.set(ModFilesMap.#toKey(value), value);
  }

  get(obj: ManagedMod | NexusModsModFileIds): NexusModsModFileInfo | undefined {
    if ("url" in obj && "nexusFileId" in obj) {
      const parsed = parseNexusModsUrl(obj.url);
      const fileId = obj.nexusFileId;
      return parsed && fileId ? this.get({ ...parsed, fileId }) : undefined;
    } else if (
      "gameDomain" in obj &&
      "gameScopedId" in obj &&
      "fileId" in obj
    ) {
      return this.#map.get(ModFilesMap.#toKey(obj));
    } else {
      return undefined;
    }
  }

  toArray(): NexusModsModFileInfo[] {
    return this.#map.values().toArray();
  }

  /** Creates a shallow-copy of ModFilesMap */
  clone(): ModFilesMap {
    return new ModFilesMap(new Map(this.#map));
  }

  static #toKey(ids: NexusModsModFileIds) {
    return `${ids.gameDomain}/${ids.gameScopedId}/${ids.fileId}`;
  }
}
