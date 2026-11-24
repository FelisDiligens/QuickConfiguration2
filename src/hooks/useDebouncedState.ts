import { useEffect, useMemo, useRef, useState } from "react";
import { ControlFunctions, Options, useDebouncedCallback } from "use-debounce";

/**
 * Wraps an external state and "caches" it with an own internal `useState`.
 * The internal state is updated immediately, but the external state's update is debounced.
 */
export function useDebouncedState<T>(
  state: T,
  setter: (value: T) => void,
  wait: number,
  options?: Options,
): [T, (value: T) => void] {
  const [cachedState, setCachedState] = useState(state);
  const debouncedSetter = useDebouncedCallback(setter, wait, options);
  useEffect(() => {
    if (state != cachedState) setCachedState(state);
  }, [state]);
  return [
    cachedState,
    (value: T) => {
      setCachedState(value);
      debouncedSetter(value);
    },
  ];
}

/**
 * Wraps a React state (`useState`) and "caches" it with an own internal `useState`.
 * The internal state is updated immediately, but the external state's update is debounced.
 */
export function useDebouncedReactState<T>(
  state: T,
  setter: React.Dispatch<React.SetStateAction<T>>,
  wait: number,
  options?: Options,
): [T, React.Dispatch<React.SetStateAction<T>> & ControlFunctions<undefined>] {
  const [cachedState, setCachedState] = useState(state);
  const pendingUpdates = useRef<((prev: T) => T)[]>([]);
  const commit = useDebouncedCallback(
    () => {
      const updates = pendingUpdates.current;
      pendingUpdates.current = [];
      if (updates.length > 0)
        setter((prev) => updates.reduce((acc, update) => update(acc), prev));
    },
    wait,
    options,
  );
  useEffect(() => {
    if (!commit.isPending() && state != cachedState) setCachedState(state);
  }, [state]);
  const wrappedSetter = useMemo<
    React.Dispatch<React.SetStateAction<T>> & ControlFunctions<undefined>
  >(() => {
    const setter = (value: React.SetStateAction<T>) => {
      setCachedState(value);
      if (typeof value === "function")
        pendingUpdates.current.push(value as (prev: T) => T);
      else pendingUpdates.current = [() => value];
      commit();
    };
    return Object.assign(setter, {
      flush: () => commit.flush() || undefined,
      cancel: () => commit.cancel(),
      isPending: () => commit.isPending(),
    });
  }, [commit]);
  return [cachedState, wrappedSetter];
}
