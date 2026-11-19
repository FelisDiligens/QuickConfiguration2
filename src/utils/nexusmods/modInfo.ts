import { ManagedMod, NexusModsModInfo } from "@/commands/bindings";
import { Nullish } from "@/types";
import { NexusModsModIds, parseNexusModsUrl } from ".";

export class ModInfoMap {
  #map: Map<string, NexusModsModInfo>;

  /**
   * Builds a lookup map from game domain and game-scoped mod ID to mod info, so
   * that looking up the info of many mods doesn't require a linear search per mod.
   */
  constructor(
    modinfos?: Nullish<NexusModsModInfo[]> | Map<string, NexusModsModInfo>,
  ) {
    if (modinfos instanceof Map) {
      this.#map = modinfos;
    } else {
      this.#map = new Map(
        (modinfos ?? []).map((modinfo) => [
          ModInfoMap.#toKey(modinfo),
          modinfo,
        ]),
      );
    }
  }

  addOrUpdate(value: NexusModsModInfo) {
    this.#map.set(ModInfoMap.#toKey(value), value);
  }

  get(obj: ManagedMod | NexusModsModIds): NexusModsModInfo | undefined {
    if ("url" in obj) {
      const parsed = parseNexusModsUrl(obj.url);
      return parsed ? this.get(parsed) : undefined;
    } else if ("gameDomain" in obj && "gameScopedId" in obj) {
      return this.#map.get(ModInfoMap.#toKey(obj));
    } else {
      return undefined;
    }
  }

  toArray(): NexusModsModInfo[] {
    return this.#map.values().toArray();
  }

  /** Creates a shallow-copy of ModInfoMap */
  clone(): ModInfoMap {
    return new ModInfoMap(new Map(this.#map));
  }

  static #toKey(modinfo: NexusModsModIds) {
    return `${modinfo.gameDomain}/${modinfo.gameScopedId}`;
  }
}
