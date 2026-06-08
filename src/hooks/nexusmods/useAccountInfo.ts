import { commandErrorToString } from "@/commands/errors";
import NexusMods from "@/commands/nexusmods";
import { useLazyAsync } from "@/hooks/async";
import {
  nexusmodsStoreAccountSync,
  useNexusModsStore,
} from "@/stores/nexusmods";
import { useSyncLoadState } from "@/utils/zustand";
import { useEffect, useMemo } from "react";

export default function useAccountInfo(fetchImmediately = true) {
  const loadState = useSyncLoadState(nexusmodsStoreAccountSync);
  const saveState = useSyncLoadState(nexusmodsStoreAccountSync);

  const profile = useNexusModsStore((store) => store.profile);
  const rateLimit = useNexusModsStore((store) => store.rateLimit);
  const account = useMemo(
    () => (!!profile && !!rateLimit ? { profile, rateLimit } : undefined),
    [profile, rateLimit],
  );
  const setAccountInfo = useNexusModsStore((store) => store.setAccountInfo);

  // Automatically load account info:
  useEffect(() => {
    if (!loadState.hasLoaded && fetchImmediately)
      nexusmodsStoreAccountSync.load().catch(console.error);
  }, []);

  const { run: fetchAccount, ...fetchState } = useLazyAsync({
    promiseFn: async () => {
      console.log("Fetching NexusMods account info...");
      const apiKey = useNexusModsStore.getState().apiKey;
      if (!apiKey) throw new Error("API key is not set");
      return await NexusMods.api.validate(apiKey);
    },
    onResolved: setAccountInfo,
    onRejected: (error) => {
      console.log(
        "Failed to fetch NexusMods account info:",
        commandErrorToString(error),
      );
    },
  });

  // Logout by deleting XML file and setting account info to `null`:
  const { run: logout, ...logoutState } = useLazyAsync({
    promiseFn: async () => {
      if (!account) return;
      console.log("Deleting NexusMods account info...");
      await NexusMods.deleteAccountInfo();
      setAccountInfo(undefined);
    },
    onRejected: (error) => {
      console.log(
        "Failed to fetch NexusMods account info:",
        commandErrorToString(error),
      );
    },
  });

  const error =
    loadState.error || saveState.error || fetchState.error || logoutState.error;

  const isPending =
    !loadState.hasLoaded ||
    loadState.isPending ||
    saveState.isPending ||
    fetchState.isPending ||
    logoutState.isPending;

  return {
    error,
    isPending,
    account,
    fetchAccount,
    logout,
  };
}
