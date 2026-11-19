import {
  NexusModsAccountInfo,
  NexusModsEndorseStatus,
  NexusModsModFileInfo,
  NexusModsModInfo,
  NexusModsProfile,
  NexusModsRateLimit,
} from "@/commands/bindings";
import { commandErrorToString } from "@/commands/errors";
import NexusMods from "@/commands/nexusmods";
import { Nullish } from "@/types";
import {
  determineLatestModVersion,
  ModFilesMap,
  ModInfoMap,
  NexusModsModFileIds,
  NexusModsModIds,
} from "@/utils/nexusmods";
import { syncStore } from "@/utils/zustand";
import fastDeepEqual from "fast-deep-equal/es6";
import { create } from "zustand";

export interface NexusModsStore {
  apiKey?: string;
  profile?: NexusModsProfile;
  rateLimit?: NexusModsRateLimit;
  modinfos: ModInfoMap;
  modfiles: ModFilesMap;

  getAccountInfo: () => NexusModsAccountInfo | undefined;
  setAccountInfo: (account: Nullish<NexusModsAccountInfo>) => void;
  setApiKey: (apiKey: string | undefined) => void;
  setProfile: (profile: NexusModsProfile | undefined) => void;
  setRatelimit: (rateLimit: NexusModsRateLimit | undefined) => void;

  getModinfo: (ids: NexusModsModIds) => NexusModsModInfo | undefined;
  setModinfos: (infos: NexusModsModInfo[]) => void;
  setEndorseStatus: (
    ids: NexusModsModIds,
    endorseStatus: NexusModsEndorseStatus,
  ) => void;
  addOrUpdateModinfo: (info: NexusModsModInfo) => void;

  getModfile: (ids: NexusModsModFileIds) => NexusModsModFileInfo | undefined;
  setModfiles: (modfiles: NexusModsModFileInfo[]) => void;
  addOrUpdateModfile: (file: NexusModsModFileInfo) => void;

  getLatestVersion: (ids: {
    gameDomain: string;
    gameScopedId: number;
    fileId?: Nullish<number>;
  }) => string | undefined;
}

export const useNexusModsStore = create<NexusModsStore>()((set, get) => ({
  modinfos: new ModInfoMap(),
  modfiles: new ModFilesMap(),

  getAccountInfo: () => {
    const profile = get().profile;
    const rateLimit = get().rateLimit;
    const account: NexusModsAccountInfo | undefined =
      !!profile && !!rateLimit ? { profile, rateLimit } : undefined;
    return account;
  },
  setAccountInfo: (account) =>
    set({
      apiKey: account?.profile.apiKey,
      profile: account?.profile,
      rateLimit: account?.rateLimit,
    }),
  setApiKey: (apiKey) => set({ apiKey }),
  setProfile: (profile) => set({ profile }),
  setRatelimit: (rateLimit) => set({ rateLimit }),

  getModinfo: (ids) => get().modinfos.get(ids),
  setModinfos: (modinfos) => set({ modinfos: new ModInfoMap(modinfos) }),
  setEndorseStatus: (ids, endorseStatus) => {
    const modinfos = get().modinfos.clone();
    const mod = modinfos.get(ids);
    if (!mod) return;
    modinfos.addOrUpdate({
      ...mod,
      endorseStatus,
      endorsementCount: mod.endorsementCount + 1,
    });
    set({ modinfos });
  },
  addOrUpdateModinfo: (info) => {
    const modinfos = get().modinfos;
    modinfos.addOrUpdate(info);
    set({ modinfos: modinfos.clone() });
  },

  getModfile: (ids) => get().modfiles.get(ids),
  setModfiles: (modfiles) => set({ modfiles: new ModFilesMap(modfiles) }),
  addOrUpdateModfile: (file) => {
    const modfiles = get().modfiles;
    modfiles.addOrUpdate(file);
    set({ modfiles: modfiles.clone() });
  },

  getLatestVersion: (ids) => {
    return determineLatestModVersion({
      modinfo: get().getModinfo(ids),
      modfile:
        "fileId" in ids && ids.fileId
          ? get().getModfile(ids as NexusModsModFileIds)
          : undefined,
    });
  },
}));

export const nexusmodsStoreAccountSync = syncStore(
  useNexusModsStore,
  (_set, get) => ({
    load: async () => {
      console.log("[NexusModsStore] Loading account info");
      const account = await NexusMods.getAccountInfo();
      get().setAccountInfo(account);
    },
    save: () => {
      const account = get().getAccountInfo();
      if (!account) throw new Error("Account info is null or undefined");
      return async () => {
        console.log("[NexusModsStore] Saving account info");
        await NexusMods.setAccountInfo(account);
      };
    },
    watch: (store) => store.getAccountInfo(),
    equals: fastDeepEqual,
  }),
);

nexusmodsStoreAccountSync.onLoadRejected((error) => {
  console.error(
    "Failed to load NexusMods account:",
    commandErrorToString(error),
  );
});
nexusmodsStoreAccountSync.onSaveRejected((error) => {
  console.error(
    "Failed to save NexusMods account:",
    commandErrorToString(error),
  );
});

const compareModinfo = (a: NexusModsModInfo, b: NexusModsModInfo) => {
  const n = a.gameDomain.localeCompare(b.gameDomain);
  return n === 0 ? a.gameScopedId - b.gameScopedId : n;
};
const compareModfile = (a: NexusModsModFileInfo, b: NexusModsModFileInfo) => {
  const gameDomainCmp = a.gameDomain.localeCompare(b.gameDomain);
  if (gameDomainCmp !== 0) return gameDomainCmp;
  const gameScopedIdCmp = a.gameScopedId - b.gameScopedId;
  if (gameScopedIdCmp !== 0) return gameScopedIdCmp;
  return a.fileId - b.fileId;
};
interface WatchedItem {
  mods: NexusModsModInfo[];
  files: NexusModsModFileInfo[];
}

export const nexusmodsStoreModinfoSync = syncStore(
  useNexusModsStore,
  (_set, get) => ({
    load: async () => {
      console.log("[NexusModsStore] Loading mod info");
      const infos = await NexusMods.getModInfos();
      get().setModinfos(infos?.mods || []);
      get().setModfiles(infos?.files || []);
    },
    save: () => {
      const mods = get().modinfos.toArray();
      const files = get().modfiles.toArray();
      return async () => {
        console.log("[NexusModsStore] Saving mod info");
        await NexusMods.setModInfos({ mods, files });
      };
    },
    watch: (store) => ({
      mods: store.modinfos.toArray(),
      files: store.modfiles.toArray(),
    }),
    equals: (a: unknown, b: unknown) => {
      // Assert a and b are WatchedItem because that's what `watch` returns.
      return (
        fastDeepEqual(
          (a as WatchedItem).mods.sort(compareModinfo),
          (b as WatchedItem).mods.sort(compareModinfo),
        ) &&
        fastDeepEqual(
          (a as WatchedItem).files.sort(compareModfile),
          (b as WatchedItem).files.sort(compareModfile),
        )
      );
    },
  }),
);

nexusmodsStoreModinfoSync.onLoadRejected((error) => {
  console.error(
    "Failed to load NexusMods mod info:",
    commandErrorToString(error),
  );
});
nexusmodsStoreModinfoSync.onSaveRejected((error) => {
  console.error(
    "Failed to save NexusMods mod info:",
    commandErrorToString(error),
  );
});
