import { ManagedMod, NexusModsModInfo } from "@/commands/bindings";

/**
 * Extracts the mod ID from a URL.
 * @param url The url to the mod page. Example: "https://www.nexusmods.com/fallout76/mods/546?tab=files"
 * @returns The mod ID. Example: 546
 */
function getModIdFromUrl(url: string): number | undefined {
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
