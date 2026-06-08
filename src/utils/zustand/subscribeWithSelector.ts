import { copy } from "fast-copy";
import { StoreApi } from "zustand";

/**
 * Lets you subscribe to a specific slice based on current state.
 *
 * Adapted from
 * - https://github.com/pmndrs/zustand/discussions/3317
 * - https://github.com/pmndrs/zustand/blob/465b91fc3d9bc60bea2444a15f9b3d25ef753892/src/middleware/subscribeWithSelector.ts#L46
 *
 * @param store `StoreApi` to listen to. In most cases, one can pass the `useXYZStore` function.
 * @param selector Select a slice of the store to listen to.
 * @param listener A function that is called when the selected slice changed.
 * @param options Can take a custom `equalityFn`, defaults to `Object.is`.
 * @returns A function to unsubscribe from the store.
 */
export function subscribeWithSelector<T, U>(
  store: StoreApi<T>,
  selector: (state: T) => U,
  listener: (selectedState: U, previousSelectedState: U) => void,
  options?: {
    equalityFn?: (a: U, b: U) => boolean;
    fireImmediately?: boolean;
  },
) {
  const equalityFn =
    options?.equalityFn != undefined ? options.equalityFn : Object.is;
  let prevSlice = copy(selector(store.getState()));
  if (options?.fireImmediately) {
    listener(prevSlice, prevSlice);
  }
  return store.subscribe((state, _prevState) => {
    const slice = selector(state);
    if (!equalityFn(prevSlice, slice)) {
      listener(slice, prevSlice);
    }
    prevSlice = copy(slice);
  });
}
