import { ManagedMod, NexusModsModInfo } from "@/commands/bindings";

/**
 * Extracts the mod ID from a URL.
 * @param url The url to the mod page. Example: "https://www.nexusmods.com/fallout76/mods/546?tab=files"
 * @returns The mod ID. Example: 546
 */
export function getModIdFromUrl(url: string): number | undefined {
  if (!url || !url.includes("www.nexusmods.com/") || !url.includes("/mods/")) {
    return undefined;
  }

  let modId = url.substring(url.indexOf("/mods/") + 6);
  const questionMarkIndex = modId.indexOf("?");
  if (questionMarkIndex !== -1) {
    modId = modId.substring(0, questionMarkIndex);
  }

  const parsed = parseInt(modId, 10);
  if (isNaN(parsed)) {
    return undefined;
  }
  return parsed;
}

export function getModInfo(
  mod: ManagedMod,
  modinfos: NexusModsModInfo[] | null | undefined,
): NexusModsModInfo | undefined {
  if (modinfos == null) return undefined;
  const modId = getModIdFromUrl(mod.url);
  if (modId == null) return undefined;
  const modinfo = modinfos.find((modinfo) => modinfo.gameScopedId === modId);
  if (modinfo == null) return undefined;
  return modinfo;
}

/**
 * Builds a lookup map from game-scoped mod ID to mod info, so that looking up
 * the info of many mods doesn't require a linear search per mod.
 */
export function createModinfoMap(
  modinfos: NexusModsModInfo[] | null | undefined,
): Map<number, NexusModsModInfo> {
  return new Map(
    (modinfos ?? []).map((modinfo) => [modinfo.gameScopedId, modinfo]),
  );
}

export function getModInfoFromMap(
  mod: ManagedMod,
  modinfoMap: Map<number, NexusModsModInfo>,
): NexusModsModInfo | undefined {
  const modId = getModIdFromUrl(mod.url);
  if (modId == null) return undefined;
  return modinfoMap.get(modId);
}
