import { commands } from "@/commands/bindings";
import { AnyError, commandErrorToString } from "@/commands/errors";
import { useAsync } from "@/hooks/async";
import { windowCloseService } from "@/services/windowCloseService";
import { useProfilesStore } from "@/stores/profiles";
import { atom, useAtom, useSetAtom } from "jotai";
import { useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";

// This value tells us whether we need to save the ini file.
// It lets us avoid saving the ini file multiple times when changing multiple values.
const needsToSaveAtom = atom(false);

// This value tells us whether a value was changed that necessitates fetching a new value.
// (For example, if two tweaks change the same value, only one tweak would update... bad!)
// It's implemented as a counter and incremented when the setter is called and useTweak has reloadNecessary set to true.
const needsToReloadAtom = atom(0);

// Saves the error when saving ini files.
export const errorAtom = atom<AnyError>(undefined);

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
  const [needsToSave, setNeedsToSave] = useAtom(needsToSaveAtom);
  const [needsToReload, setNeedsToReload] = useAtom(needsToReloadAtom);
  const setError = useSetAtom(errorAtom);

  const iniPath = useProfilesStore((store) => store.getIniPath());
  const iniPrefix = useProfilesStore((store) => store.getIniPrefix());

  // On first mount or when the ini file path changes or when a reload is necessary,
  // load the value:
  const { data: value, setData: setValue } = useAsync({
    promiseFn: getter,
    watch: [iniPath, iniPrefix, needsToReload, defaultValue],
    initialValue: defaultValue,
    onRejected: console.error,
  });

  // Debounce saving the ini file by 5s for better performance:
  const debouncedSave = useDebouncedCallback(async () => {
    if (needsToSave && iniPath && iniPrefix) {
      setNeedsToSave(false);
      try {
        setError(undefined);
        return await commands.iniSave(iniPath, iniPrefix);
      } catch (error) {
        console.error(
          "Couldn't save ini files:",
          commandErrorToString(error as AnyError),
        );
        setError(error as AnyError);
        throw error;
      }
    }
  }, 5000);

  const wrappedSetter = async (value: T) => {
    setValue(value);
    await setter(value);
    setNeedsToSave(true);
    if (reloadNecessary) setNeedsToReload((count) => count + 1);
    await debouncedSave();
  };

  // When the ini file path changes, cancel the debounced save:
  useEffect(() => {
    debouncedSave.cancel();
    setNeedsToSave(false);
  }, [iniPath, iniPrefix]);

  // Save the ini file before the component unmounts:
  useEffect(() => {
    return () => {
      debouncedSave.flush()?.catch((reason) => {
        console.error(`Couldn't save ini file on unmount: ${reason}`);
        setError(reason as AnyError);
      });
    };
  }, []);

  // Save the ini file before the window closes:
  useEffect(() => {
    return windowCloseService.subscribe(async () => {
      await debouncedSave.flush();
    });
  }, []);

  return [value != null ? value : defaultValue, wrappedSetter, defaultValue];
}
