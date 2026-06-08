import {
  ManagedMod,
  ManagedMods,
  ModInstallationState,
  ModsStateUpdate,
} from "@/commands/bindings";
import { commandErrorToString } from "@/commands/errors";
import Mods from "@/commands/mods";
import { windowCloseService } from "@/services/windowCloseService";
import { useProfilesStore } from "@/stores/profiles";
import { subscribeWithSelector, syncStore } from "@/utils/zustand";
import fastDeepEqual from "fast-deep-equal/es6";
import { t } from "i18next";
import { produce } from "immer";
import _ from "lodash";
import { create } from "zustand";
import { useToastsStore } from "./toasts";

interface Additions {
  selectedModKey: string | undefined;
}

interface Actions {
  getManagedMods: () => ManagedMods;
  /** Get a mod by key. Returns undefined if not found. */
  getMod: (key: string) => ManagedMod | undefined;
  getModState: (key: string) => ModInstallationState | undefined;
  setEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  setState: React.Dispatch<React.SetStateAction<ModsStore["state"]>>;
  setMods: React.Dispatch<React.SetStateAction<ModsStore["mods"]>>;
  setMod: (key: string, mod: React.SetStateAction<ManagedMod>) => void;
  setModEnabled: (key: string, enabled: boolean) => void;
  deleteMod: (key: string) => void;
  enableMod: (key: string) => void;
  disableMod: (key: string) => void;
  disableAllMods: () => void;
  enableModsGlobally: () => void;
  disableModsGlobally: () => void;
  toggleModsGlobally: () => void;
  selectModByKey: (key: string) => void;
  getSelectedModIndex: () => number;
  updateStore: (update: ModsStateUpdate) => void;
  isDeploymentNecessary: () => boolean;
}

export type ModsStore = ManagedMods & Additions & Actions;

export const useModsStore = create<ModsStore>()((set, get) => ({
  // State:
  enabled: true,
  settings: {
    resourceList: "",
    copyMethod: "copy",
  },
  mods: [],
  state: [],
  selectedModKey: undefined,

  // Actions:
  getManagedMods: () => ({
    enabled: get().enabled,
    mods: get().mods,
    state: get().state,
    migratedFromV1: get().migratedFromV1,
  }),
  getMod: (key) => get().mods.find((mod) => mod.key === key),
  getModState: (key) => get().state.find((state) => state.key === key),
  setEnabled: (enabled) =>
    typeof enabled === "function"
      ? set({ enabled: enabled(get().enabled) })
      : set({ enabled }),
  setState: (state) =>
    typeof state === "function"
      ? set({ state: state(get().state) })
      : set({ state }),
  setMods: (mods) =>
    typeof mods === "function"
      ? set({ mods: mods(get().mods) })
      : set({ mods }),
  setMod: (key, updatedMod) => {
    set({
      mods: get().mods.map((mod) =>
        mod.key === key
          ? typeof updatedMod === "function"
            ? updatedMod(mod)
            : updatedMod
          : mod,
      ),
    });
  },
  setModEnabled: (key, enabled) => {
    set({
      mods: produce(get().mods, (mods) => {
        for (const mod of mods) {
          if (mod.key == key) mod.enabled = enabled;
        }
      }),
    });
  },
  deleteMod: (key) => {
    set({
      mods: get().mods.filter((mod) => mod.key !== key),
    });
  },
  enableMod: (key) => get().setModEnabled(key, true),
  disableMod: (key) => get().setModEnabled(key, false),
  disableAllMods: () => {
    set({
      mods: produce(get().mods, (mods) => {
        for (const mod of mods) {
          mod.enabled = false;
        }
      }),
    });
  },
  enableModsGlobally: () => set({ enabled: true }),
  disableModsGlobally: () => set({ enabled: false }),
  toggleModsGlobally: () => set({ enabled: !get().enabled }),
  selectModByKey: (key) => set({ selectedModKey: key }),
  getSelectedModIndex: () => {
    const selectedKey = get().selectedModKey;
    return get().mods.findIndex((mod) => mod.key === selectedKey);
  },
  updateStore: (update) => {
    switch (update.type) {
      case "updated-all":
        set(update.message);
        break;
      case "updated-enabled":
        get().setEnabled(update.message);
        break;
      case "updated-state":
        get().setState(update.message);
        break;
      case "updated-mods":
        get().setMods(update.message);
        break;
      case "updated-mod":
        get().setMod(update.message.key, update.message);
        break;
      case "appended-mod": {
        const mod = update.message;
        get().setMods((mods) => _.uniqBy([...mods, mod], (mod) => mod.key));
        break;
      }
      case "deleted-mod":
        get().deleteMod(update.message);
        break;
      default: {
        const payload = update as { type: string; message: unknown };
        throw new Error(`Unhandled update type: ${payload.type}`);
      }
    }
  },
  isDeploymentNecessary: () => {
    const mods = get().mods;
    const enabledMods = mods.filter((mod) => !!mod.enabled).length;
    const deployedMods = get().state.length;

    // If mods were disabled globally:
    if (!get().enabled) {
      return deployedMods > 0; // We only need to deploy (aka. remove mods), if there's at least one deployed mod.
    }

    // If number of enabled mods is different from number of deployed mods:
    if (enabledMods != deployedMods) {
      return true;
    }

    for (const mod of mods) {
      const state = get().getModState(mod.key);
      const deployed = !!state;
      if (mod.enabled != deployed) {
        return true; // The mod is enabled but not deployed or it is disabled but deployed.
      }
      if (deployed && mod.options.rootFolder !== state?.rootFolder) {
        return true; // The mod's root folder changed after deployment
      }
    }

    for (const state of get().state) {
      const mod = get().getMod(state.key);
      const exists = !!mod;
      if (!exists) {
        return true; // A mod is deployed but it doesn't exist anymore, e.g. it was removed.
      }
    }

    return false;
  },
}));

export const modsStoreSync = syncStore(useModsStore, (set, get) => ({
  load: async () => {
    const modsPath = useProfilesStore.getState().getModsPath();
    if (!modsPath) throw new Error(t("mods.errors.unsetModsPath"));
    const mods = await Mods.metadata.loadOrDefaults(modsPath);
    set(mods);
  },
  save: () => {
    const modsPath = useProfilesStore.getState().getModsPath();
    if (!modsPath) throw new Error(t("mods.errors.unsetModsPath"));
    const mods = get().getManagedMods();
    console.log("Mods store changes detected, saving queued.");
    return async () => await Mods.metadata.save(modsPath, mods);
  },
  watch: (store) => store.getManagedMods(),
  equals: fastDeepEqual,
  debounce: 5000,
}));

modsStoreSync.onLoadResolved(() => {
  console.log("Mods store (re)loaded.");
});
modsStoreSync.onLoadRejected((error) => {
  console.log("Mods store couldn't load:", commandErrorToString(error));
});
modsStoreSync.onSaveResolved(() => {
  console.log("Mods store saved.");
});
modsStoreSync.onSaveRejected((error) => {
  useToastsStore
    .getState()
    .addToast(
      t("mods.modOrderTab.toasts.savingFailed"),
      t("common.error") + ": " + commandErrorToString(error),
      "danger",
    );
});

// TODO: Perhaps instead of reloading, invalidate the state? So it only reloads when needed e.g. when navigating back to /mods
subscribeWithSelector(
  useProfilesStore,
  (store) => store.getModsPath(),
  (modsPath) => {
    // Only reload if modsPath is set and the store has previously loaded:
    const hasLoaded = modsStoreSync.getLoadState().hasLoaded;
    if (modsPath && hasLoaded) modsStoreSync.load().catch(console.error);
  },
  { equalityFn: fastDeepEqual },
);

// Save on window close:
windowCloseService.subscribe(async () => {
  await modsStoreSync.flushSave();
});

/**
 * Updates the mods store without triggering the debounced save.
 * The function can be used to update the store after a Tauri command already saved the most recent state.
 */
export function updateModsStore(update: ModsStateUpdate, preventSave = true) {
  useModsStore.getState().updateStore(update);
  if (preventSave) modsStoreSync.cancelSave();
}
