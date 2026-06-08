import { StateStorage } from "zustand/middleware";

/**
 * Returns a function that creates a storage engine compatible with Zustand's createJSONStorage.
 * @param getter An async getter returning a state that is JSON serializable.
 * @param setter An async setter getting a POJO / Array / etc.
 */
export function createStorageEngineFactory<S, T extends { state: S }>(
  getter: () => Promise<S>,
  setter: (value: S) => Promise<void> | Promise<null>,
) {
  return function (): StateStorage {
    return {
      getItem: async (_name: string) => {
        return JSON.stringify({
          state: await getter(),
          version: 0,
        });
      },
      setItem: async (_name: string, value: string) => {
        await setter((JSON.parse(value) as T).state);
      },
      removeItem: (_name: string) => {
        throw new Error("Not implemented!");
      },
    };
  };
}
