import { commands } from "@/commands/bindings";
import { commandErrorToString } from "@/commands/errors";
import Mods from "@/commands/mods";
import { windowCloseService } from "@/services/windowCloseService";
import { subscribeWithSelector, syncStore } from "@/utils/zustand";
import fastDeepEqual from "fast-deep-equal/es6";
import { t } from "i18next";
import { SetStateAction } from "jotai";
import { Dispatch } from "react";
import { create } from "zustand";
import { useProfilesStore } from "./profiles";
import { useSettingsStore } from "./settings";
import { useToastsStore } from "./toasts";

export interface ResourceListStore {
  resources: string[];
  setResources: Dispatch<SetStateAction<string[]>>;
}

export const useResourceListStore = create<ResourceListStore>()((set, get) => ({
  resources: [],
  setResources: (resources) =>
    typeof resources === "function"
      ? set({ resources: resources(get().resources) })
      : set({ resources }),
}));

export const resourceListStoreSync = syncStore(
  useResourceListStore,
  (set, get) => ({
    load: async () => {
      console.log("Loading resource list...");
      const iniKey = useSettingsStore.getState().modManager.resourceList;
      const resources = await Mods.resourceList.loadFromIni(
        "Custom",
        "Archive",
        iniKey,
      );
      set({ resources });
    },
    save: () => {
      const resources = get().resources;
      const iniKey = useSettingsStore.getState().modManager.resourceList;
      const modsPath = useProfilesStore.getState().getModsPath();
      const iniPath = useProfilesStore.getState().getIniPath();
      const iniPrefix = useProfilesStore.getState().getIniPrefix();
      console.log(`Queueing saving of resource list: ${resources}`);
      return async () => {
        console.log(`Saving resource list: ${resources}`);
        if (!modsPath) throw new Error(t("mods.errors.unsetModsPath"));
        if (!iniPath || !iniPrefix)
          throw new Error(t("mods.errors.unsetIniPathOrIniPrefix"));

        await Mods.resourceList.saveToIni(
          resources,
          "Custom",
          "Archive",
          iniKey,
        );
        await Mods.resourceList.saveToTextFile(resources, modsPath);
        await commands.iniSave(iniPath, iniPrefix);
      };
    },
    watch: (store) => store.resources,
    equals: fastDeepEqual,
    debounce: 5000,
  }),
);

resourceListStoreSync.onLoadResolved(() => {
  const resources = useResourceListStore.getState().resources;
  console.log(`Loaded resource list: ${resources}`);
});
resourceListStoreSync.onLoadRejected((error) => {
  console.error(`Failed to load resource list: ${commandErrorToString(error)}`);
});
resourceListStoreSync.onSaveRejected((error) => {
  console.error(`Failed to save resource list: ${commandErrorToString(error)}`);
  useToastsStore
    .getState()
    .addToast(
      t("mods.resourceListTab.toasts.savingFailed"),
      t("common.error") + ": " + commandErrorToString(error),
      "danger",
    );
});

// TODO: Perhaps instead of reloading, invalidate the state? So it only reloads when needed e.g. when navigating back to /mods
subscribeWithSelector(
  useSettingsStore,
  (store) => store.modManager.resourceList,
  (resourceList) => {
    // Only reload if resourceList is set and the store has previously loaded:
    const hasLoaded = resourceListStoreSync.getLoadState().hasLoaded;
    if (resourceList && hasLoaded)
      resourceListStoreSync.load().catch(console.error);
  },
);

// TODO: Perhaps instead of reloading, invalidate the state? So it only reloads when needed e.g. when navigating back to /mods
subscribeWithSelector(
  useProfilesStore,
  (store) => [store.getModsPath(), store.getIniPath(), store.getIniPrefix()],
  ([modsPath, iniPath, iniPrefix]) => {
    // Only reload if all paths are set and the store has previously loaded:
    const hasLoaded = resourceListStoreSync.getLoadState().hasLoaded;
    if (modsPath && iniPath && iniPrefix && hasLoaded)
      resourceListStoreSync.load().catch(console.error);
  },
  { equalityFn: fastDeepEqual },
);

// Save on window close:
windowCloseService.subscribe(async () => {
  await resourceListStoreSync.flushSave();
});
