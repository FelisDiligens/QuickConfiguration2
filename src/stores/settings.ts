import {
  commands,
  ModManagerSettings,
  Settings,
  Theme,
} from "@/commands/bindings";
import { syncStore } from "@/utils/zustand";
import fastDeepEqual from "fast-deep-equal/es6";
import { Dispatch, SetStateAction } from "react";
import { create } from "zustand";

interface Actions {
  setSettings: Dispatch<SetStateAction<Settings>>;
  setModManagerSettings: Dispatch<SetStateAction<ModManagerSettings>>;
  setTheme: (theme: Theme) => void;
  setUseGameCursor: (value: boolean) => void;
  setLanguage: (value: string) => void;
  setFetchServerStatusOnStart: (value: boolean) => void;
  setCheckForUpdatesOnStart: (value: boolean) => void;
  setDownloadTranslationsOnStart: (value: boolean) => void;
  setQuitOnGameLaunch: (value: boolean) => void;
  setNavigationCollapsed: (value: boolean) => void;
  setMigrationDismissed: (value: boolean) => void;
  setPrereleaseDismissed: (value: boolean) => void;
}

export type SettingsStore = Settings & Actions;

export const useSettingsStore = create<SettingsStore>()((set, get) => ({
  version: "",
  theme: "light",
  useGameCursor: false,
  language: "en",
  translationsLastUpdated: null,
  fetchServerStatusOnStart: true,
  checkForUpdatesOnStart: true,
  downloadTranslationsOnStart: true,
  quitOnGameLaunch: true,
  navigationCollapsed: false,
  modManager: {
    resourceList: "",
    copyMethod: "hardlink",
    resourceInsertionPosition: "append",
    keepConfigFiles: true,
    downloadPath: "",
    showNexusModsTitle: true,
  },
  migratedFromV1: null,
  prereleaseDismissed: null,
  setSettings: (settings) => set(settings),
  setModManagerSettings: (modManager) =>
    typeof modManager === "function"
      ? set({ modManager: modManager(get().modManager) })
      : set({ modManager }),
  setTheme: (theme: Theme) => {
    set({ theme });
  },
  setUseGameCursor: (value: boolean) => {
    set({ useGameCursor: value });
  },
  setLanguage: (value: string) => {
    set({ language: value });
  },
  setFetchServerStatusOnStart: (value: boolean) => {
    set({ fetchServerStatusOnStart: value });
  },
  setCheckForUpdatesOnStart: (value: boolean) => {
    set({ checkForUpdatesOnStart: value });
  },
  setDownloadTranslationsOnStart: (value: boolean) => {
    set({ downloadTranslationsOnStart: value });
  },
  setQuitOnGameLaunch: (value: boolean) => {
    set({ quitOnGameLaunch: value });
  },
  setNavigationCollapsed: (value: boolean) => {
    set({ navigationCollapsed: value });
  },
  setMigrationDismissed: (value: boolean) => {
    const migratedFromV1 = get().migratedFromV1;
    set({
      migratedFromV1: migratedFromV1
        ? { ...migratedFromV1, dismissed: value }
        : null,
    });
  },
  setPrereleaseDismissed: (value: boolean) => {
    set({ prereleaseDismissed: value });
  },
}));

export const settingsStoreSync = syncStore(useSettingsStore, (set, get) => ({
  load: async () => {
    const settings = await commands.getSettings();
    set(settings);
  },
  save: () => {
    const settings = get();
    return async () => await commands.saveSettings(settings);
  },
  equals: fastDeepEqual,
}));
settingsStoreSync.load().catch(console.error);
