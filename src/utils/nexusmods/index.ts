import { NexusModsModFileInfo, NexusModsModInfo } from "@/commands/bindings";

export * from "./modFiles";
export * from "./modInfo";

export interface NexusModsModIds {
  gameDomain: string;
  gameScopedId: number;
}

export interface NexusModsModFileIds {
  gameDomain: string;
  gameScopedId: number;
  fileId: number;
}

const nexusmodsUrlRegex =
  /www\.nexusmods\.com\/(?<game_domain>\w+)\/mods\/(?<game_scoped_id>\d+)/;

/**
 * Extracts the game domain and game scoped ID from a URL.
 * If it couldn't parse the URL, returns undefined.
 * @param url The url to the mod page. Example: "https://www.nexusmods.com/fallout76/mods/546?tab=files"
 * @returns For example: { gameDomain: "fallout76", gameScopedId: 546 }
 */
export function parseNexusModsUrl(url: string): NexusModsModIds | undefined {
  // Example: https://www.nexusmods.com/fallout76/mods/546?tab=files
  if (!url) return undefined;

  const match = nexusmodsUrlRegex.exec(url);
  if (!match?.groups) {
    console.error(`Regex didn't match given URL: ${url}`);
    return undefined;
  }

  const gameDomain = match.groups.game_domain;
  if (!gameDomain) {
    console.error(`Couldn't extract game_domain from URL: ${url}`);
    return undefined;
  }

  const gameScopedIdStr = match.groups.game_scoped_id;
  if (!gameScopedIdStr) {
    console.error(`Couldn't extract game_scoped_id from URL: ${url}`);
    return undefined;
  }

  const gameScopedId = Number.parseInt(gameScopedIdStr, 10);
  if (!Number.isSafeInteger(gameScopedId) || gameScopedId < 0) {
    console.error(`game_scoped_id is not a valid integer: ${url}`);
    return undefined;
  }

  return { gameDomain, gameScopedId };
}

export function determineLatestModVersion({
  modinfo,
  modfile,
}: {
  modinfo?: NexusModsModInfo;
  modfile?: NexusModsModFileInfo;
}) {
  return modfile?.latestFile?.version || modfile?.version || modinfo?.version;
}
