import {
  ManagedMod,
  NexusModsAccountInfo,
  NexusModsModFileInfo,
  NexusModsModInfo,
} from "@/commands/bindings";

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

/** Prefers mod file version over the overall mod version. */
export function determineLatestModVersion({
  modinfo,
  modfile,
}: {
  modinfo?: NexusModsModInfo;
  modfile?: NexusModsModFileInfo;
}) {
  return modfile?.latestFile?.version || modfile?.version || modinfo?.version;
}

export function isModInstallOutdated({
  mod,
  modinfo,
  modfile,
}: {
  mod: ManagedMod;
  modinfo?: NexusModsModInfo;
  modfile?: NexusModsModFileInfo;
}) {
  if (
    mod.nexusFileId != undefined &&
    modfile?.fileId === mod.nexusFileId &&
    modfile.latestFile?.fileId != undefined &&
    modfile.fileId !== modfile.latestFile.fileId
  ) {
    return true;
  }
  if (!mod.version || mod.version.trim() === "") {
    return false;
  }
  const latestVersion = determineLatestModVersion({ modinfo, modfile });
  return latestVersion != undefined && mod.version !== latestVersion;
}

export function canUserDownloadDirectly(user: NexusModsAccountInfo) {
  return user.profile.membership !== "Basic";
}
