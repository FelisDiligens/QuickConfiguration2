import {
  NexusModsAccountInfo,
  NexusModsEndorseStatus,
  NexusModsModInfo,
  NexusModsProfile,
  NexusModsRateLimit,
} from "@/commands/bindings";
import { commandErrorToString } from "@/commands/errors";
import NexusMods from "@/commands/nexusmods";
import { syncStore } from "@/utils/zustand";
import fastDeepEqual from "fast-deep-equal/es6";
import { produce } from "immer";
import _ from "lodash";
import { create } from "zustand";

export interface NexusModsStore {
  apiKey?: string;
  profile?: NexusModsProfile;
  rateLimit?: NexusModsRateLimit;
  modinfos: NexusModsModInfo[];

  getAccountInfo: () => NexusModsAccountInfo | undefined;
  setAccountInfo: (account: NexusModsAccountInfo | null | undefined) => void;
  setApiKey: (apiKey: string | undefined) => void;
  setProfile: (profile: NexusModsProfile | undefined) => void;
  setRatelimit: (rateLimit: NexusModsRateLimit | undefined) => void;

  getModinfo: (
    gameDomain: string,
    gameScopedId: number,
  ) => NexusModsModInfo | undefined;
  setModinfos: (infos: NexusModsModInfo[]) => void;
  setEndorseStatus: (
    gameDomain: string,
    gameScopedId: number,
    endorseStatus: NexusModsEndorseStatus,
  ) => void;
  addOrUpdateModinfo: (info: NexusModsModInfo) => void;
}

export const useNexusModsStore = create<NexusModsStore>()((set, get) => ({
  modinfos: [],

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

  getModinfo: (gameDomain, gameScopedId) =>
    get().modinfos.find(
      (info) =>
        info.gameDomain === gameDomain && info.gameScopedId === gameScopedId,
    ),
  setModinfos: (modinfos) => set({ modinfos }),
  setEndorseStatus: (gameDomain, gameScopedId, endorseStatus) => {
    produce((modinfos) => {
      for (const mod of modinfos) {
        if (
          mod.gameDomain === gameDomain &&
          mod.gameScopedId === gameScopedId
        ) {
          mod.endorseStatus = endorseStatus;
          mod.endorsementCount++;
        }
      }
    }, get().modinfos);
  },
  addOrUpdateModinfo: (info) => {
    set({
      modinfos: _([info, ...get().modinfos])
        .uniqBy((mod) => `${mod.gameDomain}/${mod.gameScopedId}`)
        .value(),
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

export const nexusmodsStoreModinfoSync = syncStore(
  useNexusModsStore,
  (_set, get) => ({
    load: async () => {
      console.log("[NexusModsStore] Loading mod info");
      const infos = await NexusMods.getModInfos();
      get().setModinfos(infos?.mods || []);
    },
    save: () => {
      const mods = get().modinfos;
      return async () => {
        console.log("[NexusModsStore] Saving mod info");
        await NexusMods.setModInfos({ mods });
      };
    },
    watch: (store) => store.modinfos,
    equals: fastDeepEqual,
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
