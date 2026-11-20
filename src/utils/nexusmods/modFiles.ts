import {
  ManagedMod,
  NexusModsFileCategory,
  NexusModsModFile,
  NexusModsModFileInfo,
} from "@/commands/bindings";
import { Nullish } from "@/types";
import { NexusModsModFileIds, parseNexusModsUrl } from ".";

export interface ModFileGroup {
  category: NexusModsFileCategory | null;
  files: NexusModsModFile[];
}

const categoryOrder: (NexusModsFileCategory | null)[] = [
  "MAIN",
  "UPDATE",
  "OPTIONAL",
  "MISCELLANEOUS",
  "OLD_VERSION",
  null,
];

/**
 * Groups mod files by their category for display purposes.
 * Archived files are filtered out. The groups are ordered by `categoryOrder`;
 * files without a category come last.
 */
export function groupModFilesByCategory(
  modFiles: NexusModsModFile[],
): ModFileGroup[] {
  const groups = new Map<NexusModsFileCategory | null, NexusModsModFile[]>();
  for (const file of modFiles) {
    if (file.category === "ARCHIVED") continue;
    const group = groups.get(file.category);
    if (group) group.push(file);
    else groups.set(file.category, [file]);
  }
  return categoryOrder
    .filter((category) => groups.has(category))
    .map((category) => ({ category, files: groups.get(category) ?? [] }));
}

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
