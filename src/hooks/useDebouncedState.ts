import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

/**
 * Wraps an external state and "caches" it with an own internal `useState`.
 * The internal state is updated immediately, but the external state's update is debounced.
 */
export default function useDebouncedState<T>(
  state: T,
  setter: (value: T) => void,
  wait: number,
): [T, (value: T) => void] {
  const [cachedState, setCachedState] = useState(state);
  const debouncedSetter = useDebouncedCallback(setter, wait);
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
