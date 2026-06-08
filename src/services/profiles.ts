import { commands, GameEdition, Profile } from "@/commands/bindings";
import { useProfilesStore } from "@/stores/profiles";

async function detectGameEditionInternal(
  gamePath?: string,
  iniPath?: string,
): Promise<GameEdition> {
  const iniPrefix = await commands.detectIniPrefix(iniPath || null);
  if (
    iniPrefix == "Project76" ||
    gamePath?.includes("XboxGames") ||
    gamePath?.includes("ModifiableWindowsApps")
  ) {
    return "Xbox";
  } else if (gamePath?.includes("Playtest")) {
    return "SteamPTS";
  } else {
    return "Steam";
  }
}

/**
 * Attempts to detect game edition by looking for Steam or Xbox installation folders.
 * @returns Steam, SteamPTS, or Xbox
 */
export async function detectGameEdition(): Promise<GameEdition> {
  const gamePath = useProfilesStore.getState().getGamePath();
  const iniPath = useProfilesStore.getState().getIniPath();
  return await detectGameEditionInternal(gamePath, iniPath);
}

export function createProfileWithDefaults(
  title?: string | null,
  edition?: GameEdition | null,
  gamePath?: string | undefined,
  iniPath?: string | null,
): Profile {
  const profile: Profile = {
    key: crypto.randomUUID(),
    iniPath: iniPath || "",
    ...getProfileDefaultsForGamePath(gamePath),
    ...getProfileDefaultsForGameEdition(edition),
  };
  profile.title = title || profile.title || "";
  return profile;
}

/**
 * Attempts to automatically detect to correct configuration by searching for ini files and game installation folder.
 * @returns New profile with auto-detected configuration
 */
export async function createProfileWithAutoDetectedDefaults(
  title?: string | null,
): Promise<Profile> {
  const gamePath = (await commands.detectGamePath()).at(0);
  const iniPath = await commands.detectIniPath(gamePath || null);
  const edition = await detectGameEditionInternal(
    gamePath,
    iniPath || undefined,
  );
  return createProfileWithDefaults(title, edition, gamePath || "", iniPath);
}

/**
 * Merge the partial profile into the full profile on game edition change.
 * @param edition Game edition e.g. Steam or Xbox
 * @returns Launch configuration and ini prefix
 */
export function getProfileDefaultsForGameEdition(
  edition?: GameEdition | null,
): Pick<
  Profile,
  | "title"
  | "executableName"
  | "execParameters"
  | "launcherURL"
  | "iniPrefix"
  | "gameEdition"
  | "launchOption"
> {
  const isXbox = edition == "Xbox" || edition == "MSStore";
  let title = "";
  let launcherURL = "";
  switch (edition) {
    case "Steam":
      title = "Steam";
      launcherURL = "steam://run/1151340";
      break;
    case "SteamPTS":
      title = "Steam PTS";
      launcherURL = "steam://run/1836200";
      break;
    case "Xbox":
    case "MSStore":
      title = "Xbox";
      launcherURL = String.raw`shell:appsfolder\BethesdaSoftworks.Fallout76-PC_3275kfvn8vcwc!Fallout76`;
      break;
    case "BethesdaNet":
      title = "Bethesda.net";
      launcherURL = "bethesdanet://run/20";
      break;
    case "BethesdaNetPTS":
      title = "Bethesda.net PTS";
      launcherURL = "bethesdanet://run/57";
      break;
    default:
      title = "Unknown";
      break;
  }
  return {
    title,
    executableName: isXbox ? "Project76_GamePass.exe" : "Fallout76.exe",
    execParameters: "",
    launcherURL: launcherURL,
    iniPrefix: isXbox ? "Project76" : "Fallout76",
    gameEdition: (isXbox ? "Xbox" : edition) || "Unknown",
    launchOption: "OpenURL",
  };
}

/**
 * Merge the partial profile into the full profile on game path change.
 * @param gamePath Path to the game installation folder
 * @returns Game and mods path
 */
export function getProfileDefaultsForGamePath(
  gamePath?: string | undefined,
): Pick<Profile, "installationPath" | "modsPath"> {
  return {
    installationPath: gamePath || "",
    modsPath: useProfilesStore.getState().getDefaultModsPath(gamePath) || "",
  };
}
