import {
  nexusmodsStoreModinfoSync,
  useNexusModsStore,
} from "@/stores/nexusmods";
import { useSyncLoadState, useSyncSaveState } from "@/utils/zustand";
import { useEffect } from "react";

export default function useModinfos(fetchImmediately = true) {
  const loadState = useSyncLoadState(nexusmodsStoreModinfoSync);
  const saveState = useSyncSaveState(nexusmodsStoreModinfoSync);
  const modinfos = useNexusModsStore((store) => store.modinfos);

  // Automatically loading mod info:
  useEffect(() => {
    if (!loadState.hasLoaded && fetchImmediately)
      nexusmodsStoreModinfoSync.load().catch(console.error);
  }, []);

  const error = loadState.error || saveState.error;
  const isPending =
    !loadState.hasLoaded || loadState.isPending || saveState.isPending;

  return {
    modinfos,
    error,
    isPending,
  };
}
