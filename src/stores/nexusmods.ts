import {
  NexusModsAccountInfo,
  NexusModsEndorseStatus,
  NexusModsModInfo,
  NexusModsProfile,
  NexusModsRateLimit,
} from "@/commands/bindings";
import { commandErrorToString } from "@/commands/errors";
import NexusMods from "@/commands/nexusmods";
import { Nullish } from "@/types";
import { ModInfoMap, NexusModsModIds } from "@/utils/nexusmods";
import { syncStore } from "@/utils/zustand";
import fastDeepEqual from "fast-deep-equal/es6";
import { create } from "zustand";

export interface NexusModsStore {
  apiKey?: string;
  profile?: NexusModsProfile;
  rateLimit?: NexusModsRateLimit;
  modinfos: ModInfoMap;

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
}

export const useNexusModsStore = create<NexusModsStore>()((set, get) => ({
  modinfos: new ModInfoMap(),

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
    const modinfos = get().modinfos;
    const mod = modinfos.get(ids);
    if (!mod) return;
    mod.endorseStatus = endorseStatus;
    mod.endorsementCount++;
    set({ modinfos: modinfos.clone() });
  },
  addOrUpdateModinfo: (info) => {
    const modinfos = get().modinfos;
    modinfos.addOrUpdate(info);
    set({ modinfos: modinfos.clone() });
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

export const nexusmodsStoreModinfoSync = syncStore(
  useNexusModsStore,
  (_set, get) => ({
    load: async () => {
      console.log("[NexusModsStore] Loading mod info");
      const infos = await NexusMods.getModInfos();
      get().setModinfos(infos?.mods || []);
    },
    save: () => {
      const mods = get().modinfos.toArray();
      return async () => {
        console.log("[NexusModsStore] Saving mod info");
        await NexusMods.setModInfos({ mods });
      };
    },
    watch: (store) => store.modinfos.toArray(),
    equals: (a: unknown, b: unknown) => {
      const cmp = (a: NexusModsModInfo, b: NexusModsModInfo) => {
        const n = a.gameDomain.localeCompare(b.gameDomain);
        return n === 0 ? a.gameScopedId - b.gameScopedId : n;
      };
      // Assert a and b are NexusModsModInfo[] because that's what `watch` returns.
      return fastDeepEqual(
        (a as NexusModsModInfo[]).sort(cmp),
        (b as NexusModsModInfo[]).sort(cmp),
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
