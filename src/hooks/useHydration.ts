import { useEffect, useState } from "react";
import { Mutate, StoreApi, UseBoundStore } from "zustand";

// https://docs.pmnd.rs/zustand/integrations/persisting-store-data#how-can-i-check-if-my-store-has-been-hydrated
/**
 * When using Zustand's `persist` middleware with an asynchronous storage engine,
 * this hook checks whether the store has been hydrated or not.
 * @param useBoundStore The use hook returned from Zustand's `create` function
 * @returns Whether the store has been hydrated.
 */
export function useHydration<T>(
  useBoundStore: UseBoundStore<StoreWithPersist<T>>,
): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Note: This is just in case you want to take into account manual rehydration.
    // You can remove the following line if you don't need it.
    const unsubHydrate = useBoundStore.persist.onHydrate(() => {
      setHydrated(false);
    });

    const unsubFinishHydration = useBoundStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    setHydrated(useBoundStore.persist.hasHydrated());

    return () => {
      unsubHydrate();
      unsubFinishHydration();
    };
  }, []);

  return hydrated;
}

type StoreWithPersist<T> = Mutate<StoreApi<T>, [["zustand/persist", unknown]]>;
