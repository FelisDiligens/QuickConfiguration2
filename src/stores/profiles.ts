import { Profile, Profiles, commands } from "@/commands/bindings";
import { pathJoinSync } from "@/utils";
import { syncStore } from "@/utils/zustand";
import fastDeepEqual from "fast-deep-equal/es6";
import { produce } from "immer";
import { create } from "zustand";

interface Actions {
  setStore: (store: Partial<Profiles>) => void;
  setProfiles: (
    profiles: Profile[] | ((profiles: Profile[]) => Profile[]),
  ) => void;

  getGamePath: () => string | undefined;
  getModsPath: () => string | undefined;
  getDefaultModsPath: (gamePath?: string | undefined) => string | undefined;
  getGameDataPath: () => string | undefined;
  getModsTmpPath: () => string | undefined;
  getIniPath: () => string | undefined;
  getIniPrefix: () => string | undefined;
  getIniMainPath: () => string | undefined;
  getIniPrefsPath: () => string | undefined;
  getIniCustomPath: () => string | undefined;

  getSelectedIndex: () => number;
  setSelectedIndex: (index: number) => void;
  getSelectedProfile: () => Profile | undefined;
  getProfileByKey: (key: string) => Profile | undefined;
  setProfile: (index: number, profile: Profile) => void;
  updateProfile: (profile: Profile) => void;
  addProfile: (profile: Profile) => void;
  deleteProfile: (index: number) => void;
  moveProfileUp: (index: number) => void;
  moveProfileDown: (index: number) => void;
}

export type ProfilesStore = Profiles & Actions;

export const useProfilesStore = create<ProfilesStore>()((set, get) => ({
  profiles: [] as Profile[],
  selected: "",
  setStore: (store: Partial<Profiles>) => {
    set(store);
  },
  setProfiles: (profiles: Profile[] | ((profiles: Profile[]) => Profile[])) => {
    if (typeof profiles === "function") {
      const updateFn = profiles;
      set({ profiles: produce(get().profiles, updateFn) });
    } else {
      set({ profiles });
    }
  },

  getGamePath: () => get().getSelectedProfile()?.installationPath,
  getModsPath: () => get().getSelectedProfile()?.modsPath,
  getDefaultModsPath: (gamePath?: string | null) => {
    gamePath = gamePath || get().getGamePath();
    return gamePath ? pathJoinSync(gamePath, "Mods") : undefined;
  },
  getGameDataPath: () => {
    const gamePath = get().getGamePath();
    return gamePath ? pathJoinSync(gamePath, "Data") : undefined;
  },
  getModsTmpPath: () => {
    const modsPath = get().getModsPath();
    return modsPath ? pathJoinSync(modsPath, "_tmp") : undefined;
  },
  getIniPath: () => get().getSelectedProfile()?.iniPath,
  getIniPrefix: () => get().getSelectedProfile()?.iniPrefix,
  getIniMainPath: () => {
    const profile = get().getSelectedProfile();
    const iniPath = profile?.iniPath;
    const iniPrefix = profile?.iniPrefix;
    return iniPath && iniPrefix
      ? pathJoinSync(iniPath, `${iniPrefix}.ini`)
      : undefined;
  },
  getIniPrefsPath: () => {
    const profile = get().getSelectedProfile();
    const iniPath = profile?.iniPath;
    const iniPrefix = profile?.iniPrefix;
    return iniPath && iniPrefix
      ? pathJoinSync(iniPath, `${iniPrefix}Prefs.ini`)
      : undefined;
  },
  getIniCustomPath: () => {
    const profile = get().getSelectedProfile();
    const iniPath = profile?.iniPath;
    const iniPrefix = profile?.iniPrefix;
    return iniPath && iniPrefix
      ? pathJoinSync(iniPath, `${iniPrefix}Custom.ini`)
      : undefined;
  },

  getSelectedIndex: () =>
    get().profiles.findIndex((profile) => profile.key == get().selected),
  setSelectedIndex: (index: number) => {
    if (index >= 0 && index < get().profiles.length) {
      set({ selected: get().profiles[index].key });
    } else {
      set({ selected: "" });
    }
  },
  getSelectedProfile: () =>
    get().profiles.find((profile) => profile.key == get().selected),
  getProfileByKey: (key: string) =>
    get().profiles.find((profile) => profile.key == key),
  setProfile: (index: number, profile: Profile) => {
    set({
      profiles: produce(get().profiles, (profiles) => {
        profiles[index] = profile;
      }),
    });
  },
  updateProfile: (profile: Profile) => {
    set({
      profiles: produce(get().profiles, (profiles) => {
        for (let index = 0; index < profiles.length; index++) {
          if (profiles[index].key == profile.key) {
            profiles[index] = profile;
          }
        }
      }),
    });
  },
  addProfile: (profile: Profile) => {
    set({
      profiles: [...get().profiles, profile],
    });
  },
  deleteProfile: (index: number) => {
    const profiles = [
      ...get().profiles.slice(0, index),
      ...get().profiles.slice(index + 1),
    ];
    set({
      profiles,
      selected:
        get().selected == get().profiles.at(index)?.key
          ? profiles.at(0)?.key || ""
          : get().selected,
    });
  },
  moveProfileUp: (index: number) => {
    if (index == 0) return; // Profile is already at the top
    set({
      profiles: produce(get().profiles, (profiles) => {
        // Swap elements:
        const temp = profiles[index];
        profiles[index] = profiles[index - 1];
        profiles[index - 1] = temp;
      }),
    });
  },
  moveProfileDown: (index: number) => {
    if (index == get().profiles.length - 1) return; // Profile is already at the bottom
    set({
      profiles: produce(get().profiles, (profiles) => {
        // Swap elements:
        const temp = profiles[index];
        profiles[index] = profiles[index + 1];
        profiles[index + 1] = temp;
      }),
    });
  },
}));

export const profileStoreSync = syncStore(useProfilesStore, (set, get) => ({
  load: async () => {
    const profiles = await commands.getProfiles();
    set(profiles);
  },
  save: () => {
    const profiles = get();
    return async () => await commands.saveProfiles(profiles);
  },
  equals: fastDeepEqual,
}));
profileStoreSync.load().catch(console.error);
