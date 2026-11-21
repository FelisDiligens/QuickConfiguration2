import { NexusModsModFiles } from "@/commands/bindings";

export interface OutdatedMod {
  key: string;
  title: string;
  gameDomain: string;
  gameScopedId: number;
  currentVersion: string;
  latestVersion: string;
}

export interface TrackModFileState {
  key: string;
  gameDomain: string;
  gameScopedId: number;
  modFiles: NexusModsModFiles;
}
