import { commands } from "@/commands/bindings";
import { AnyError, commandErrorToString } from "@/commands/errors";
import { useAsync } from "@/hooks/async";
import { windowCloseService } from "@/services/windowCloseService";
import { useProfilesStore } from "@/stores/profiles";
import { useSettingsStore } from "@/stores/settings";
import { atom, getDefaultStore, useSetAtom } from "jotai";
import _ from "lodash";
import { useEffect, useRef } from "react";

// This value tells us whether we need to save the ini file.
// It lets us avoid saving the ini file multiple times when changing multiple values.
const needsToSaveAtom = atom(false);

// This value tells us whether a value was changed that necessitates fetching a new value.
// (For example, if two tweaks change the same value, only one tweak would update... bad!)
// It's implemented as a counter and incremented when the setter is called and useTweak has reloadNecessary set to true.
const needsToReloadAtom = atom(0);

// Saves the error when saving ini files.
export const errorAtom = atom<AnyError>(undefined);

const SAVE_DEBOUNCE_MS = 5000;

async function executeSave(): Promise<void> {
  const store = getDefaultStore();
  if (!store.get(needsToSaveAtom)) return;
  const iniPath = useProfilesStore.getState().getIniPath();
  const iniPrefix = useProfilesStore.getState().getIniPrefix();
  if (!iniPath || !iniPrefix) return;
  store.set(needsToSaveAtom, false);
  store.set(errorAtom, undefined);
  const bypassIniReadonly = useSettingsStore.getState().bypassIniReadonly;
  try {
    await commands.iniSave(iniPath, iniPrefix, bypassIniReadonly);
  } catch (error) {
    console.error(
      "Couldn't save ini files:",
      commandErrorToString(error as AnyError),
    );
    store.set(errorAtom, error as AnyError);
    throw error;
  }
}

// The debounced ini save is shared by all useTweak instances, so that changing
// many tweaks at once results in a single timer and a single iniSave call.
const debouncedSave = _.debounce((): Promise<void> | undefined => {
  const result = executeSave();
  void result.catch(() => undefined);
  return result;
}, SAVE_DEBOUNCE_MS);

// Save the ini file before the window closes (subscribed once for all tweaks):
windowCloseService.subscribe(async () => {
  await debouncedSave.flush();
});

/**
 * Represents an *.ini tweak. May change more than one value in more than one file.
 * @param getter If `null` is returned, the `defaultValue` will be used.
 * @param setter
 * @param defaultValue
 * @param reloadNecessary When the value changes, does it affect any other tweaks that may need updating?
 * @returns
 */
export default function useTweak<T>(
  getter: () => Promise<T | null>,
  setter: (value: T) => Promise<null> | Promise<void>,
  defaultValue: T,
  reloadNecessary = false,
): [T, (value: T) => void, T] {
  const setNeedsToSave = useSetAtom(needsToSaveAtom);
  const setNeedsToReload = useSetAtom(needsToReloadAtom);

  const iniPath = useProfilesStore((store) => store.getIniPath());
  const iniPrefix = useProfilesStore((store) => store.getIniPrefix());

  // On first mount or when the ini file path changes, load the value:
  const {
    data: value,
    setData: setValue,
    reload,
  } = useAsync({
    promiseFn: getter,
    watch: [iniPath, iniPrefix, defaultValue],
    initialValue: defaultValue,
    onRejected: console.error,
  });

  // Reload the value when another tweak with reloadNecessary: true changed a shared value.
  // Subscribing directly (instead of watching the atom in useAsync) avoids a re-render
  // of every mounted tweak when the counter changes; only changed values re-render.
  const reloadRef = useRef(reload);
  reloadRef.current = reload;
  useEffect(() => {
    return getDefaultStore().sub(needsToReloadAtom, () => reloadRef.current());
  }, []);

  const wrappedSetter = async (value: T) => {
    setValue(value);
    await setter(value);
    setNeedsToSave(true);
    if (reloadNecessary) setNeedsToReload((count) => count + 1);
    void debouncedSave();
  };

  // When the ini file path changes, cancel the pending save:
  useEffect(() => {
    debouncedSave.cancel();
    if (getDefaultStore().get(needsToSaveAtom)) setNeedsToSave(false);
  }, [iniPath, iniPrefix, setNeedsToSave]);

  // Save the ini file before the component unmounts:
  useEffect(() => {
    return () => {
      debouncedSave.flush()?.catch((reason) => {
        console.error(`Couldn't save ini file on unmount: ${reason}`);
        getDefaultStore().set(errorAtom, reason as AnyError);
      });
    };
  }, []);

  return [value != null ? value : defaultValue, wrappedSetter, defaultValue];
}
