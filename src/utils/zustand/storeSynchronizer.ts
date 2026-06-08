import { AnyError } from "@/commands/errors";
import _ from "lodash";
import { useSyncExternalStore } from "react";
import { StoreApi } from "zustand";
import { subscribeWithSelector } from "./subscribeWithSelector";

type StoreGet<T> = StoreApi<T>["getState"];
type StoreSet<T> = StoreApi<T>["setState"];

interface SyncStoreOptions<T> {
  /**
   * Loads data from external source (e.g., Tauri command, API fetch) and updates the store.
   * Receives `set` and `get` functions mirroring Zustand's create API for convenient access to the store.
   * Called manually via `StoreSynchronizer.load()`.
   */
  load: () => Promise<void> | Promise<null>;
  /**
   * Prepares state for persistence and returns a function that performs the actual save operation.
   *
   * The outer function (first call) captures the current state using `get` - this creates a closure
   * with captured state that remains consistent even if the store changes before the save completes.
   * The inner function (returned) performs the actual external update (e.g., Tauri command, API fetch).
   *
   * This two-function pattern allows the inner function to be debounced while preserving the
   * state snapshot from when the save was triggered. Without this, a debounced save might use
   * state that changed after the save was initiated.
   *
   * @example
   * save: () => {
   *   const state = get();  // Captures current state in closure
   *   return async () => {
   *     await saveToServer(state);  // Uses the captured state, even if store changed
   *   };
   * }
   */
  save: () => () => Promise<void> | Promise<null>;
  /**
   * Selects a slice of the store to watch for changes that should trigger saves.
   * Only changes to the selected slice (using `equals` for comparison) will trigger the save function.
   * If not provided, the entire store is watched.
   */
  watch?: (state: T) => unknown;
  /**
   * Custom equality function to compare store slices for determining if a save should be triggered.
   * Used by `subscribeWithSelector` to optimize change detection.
   * Defaults to `Object.is`.
   */
  equals?: (a: unknown, b: unknown) => boolean;
  /**
   * Debounce delay in milliseconds for the save function.
   * When set, only the last store change will execute `save` after this many milliseconds of inactivity.
   * The debounced save can be manually flushed via `flushSave()` or cancelled via `cancelSave()`.
   */
  debounce?: number;
}

/**
 * Creates and returns a `StoreSynchronizer` instance for bidirectional synchronization
 * between a Zustand store and an external state source.
 *
 * This is the primary way to instantiate a `StoreSynchronizer`. It provides a convenient
 * wrapper that mimics Zustand's create function API, receiving `set` and `get` functions
 * that operate on the store.
 *
 * The synchronizer will:
 * - Automatically subscribe to store changes (optionally filtered by `watch` and `equals`)
 * - Trigger the `save` function when relevant changes are detected
 * - Provide a `load` method to manually fetch and hydrate the store from external state
 *
 * @param store - The Zustand store API (vanilla or React store)
 * @param options - A function receiving `set` and `get` that returns `SyncStoreOptions<T>`
 * @returns A `StoreSynchronizer` instance managing the synchronization
 *
 * @example
 * const store = create((set, get) => ({ count: 0 }));
 *
 * const sync = syncStore(store, (set, get) => ({
 *   load: async () => {
 *     const data = await loadFromServer();
 *     set({ count: data.count });
 *   },
 *   save: () => {
 *     const { count } = get();
 *     return async () => {
 *       await saveToServer({ count });
 *     };
 *   },
 *   watch: (state) => state.count,
 *   debounce: 500,
 * }));
 *
 * // Later, manually load from server:
 * await sync.load();
 */
export function syncStore<T>(
  store: StoreApi<T>,
  options: (set: StoreSet<T>, get: StoreGet<T>) => SyncStoreOptions<T>,
) {
  const result = options(store.setState, store.getState);
  return new StoreSynchronizer(
    store,
    result.load,
    result.save,
    result.watch || ((state: T) => state),
    result.equals || Object.is,
    result.debounce,
  );
}

/**
 * React hook that subscribes to the loading state of a `StoreSynchronizer`.
 *
 * Returns the current `isPending`, `hasLoaded` and `error` which can be used to display
 * loading indicators, error messages, or success states in the UI.
 *
 * @param sync - The `StoreSynchronizer` instance to observe
 * @returns Object containing `isPending`, `hasLoaded` and `error`
 *
 * @example
 * function MyComponent() {
 *   const { isPending, hasLoaded, error } = useSyncLoadState(sync);
 *
 *   if (isPending || !hasLoaded) return <Spinner />;
 *   if (error) return <Error message={error.message} />;
 *   return <div>Ready</div>;
 * }
 */
export function useSyncLoadState<T>(sync: StoreSynchronizer<T>) {
  return useSyncExternalStore(
    (listener) => sync.subscribeLoadState(listener),
    () => sync.getLoadState(),
  );
}

/**
 * React hook that subscribes to the saving state of a `StoreSynchronizer`.
 *
 * Returns the current `isPending` and `error` which can be used to display
 * loading indicators, error messages, or success states in the UI.
 *
 * @param sync - The `StoreSynchronizer` instance to observe
 * @returns Object containing `isPending` and `error`
 *
 * @example
 * function MyComponent() {
 *   const { isPending, error } = useSyncSaveState(sync);
 *
 *   if (isPending) return <div>Saving...</div>;
 *   if (error) return <div>Save failed: {error.message}</div>;
 *   return <div>Ready</div>;
 * }
 */
export function useSyncSaveState<T>(sync: StoreSynchronizer<T>) {
  return useSyncExternalStore(
    (listener) => sync.subscribeSaveState(listener),
    () => sync.getSaveState(),
  );
}

/**
 * Manages bidirectional synchronization between a Zustand store and external state.
 *
 * The synchronizer handles:
 * - Loading external state into the store via the `load()` method
 * - Saving store state to external sources when changes are detected
 * - Debouncing saves to only execute the last save of rapid changes
 * - Tracking loading/saving state for UI feedback
 * - Cancelling stale operations when newer ones start
 *
 * **Automatic Save Behavior:**
 * The constructor sets up a subscription to the store using `subscribeWithSelector`.
 * When the watched slice changes (per `selector` and `equals`), the `save()` method is triggered.
 * This subscription only affects saves, not loads - `load()` must be called manually when
 * dependencies change.
 *
 * **Race Condition Protection:**
 * The `save` option uses a two-function pattern. The outer function captures the current
 * state in a closure, ensuring that even if the store changes before the debounced save
 * executes, the original state is preserved. This prevents race conditions where a
 * delayed save might persist with newer state.
 *
 * **Operation Counters:**
 * Each load and save operation receives a unique counter. If a new operation starts while
 * an old one is pending, the old operation checks its counter against the current counter
 * and aborts if they don't match. This prevents state corruption from stale async operations.
 *
 * **Initial loading:**
 * The `hasLoaded` flag tracks whether the initial load has completed. Saves are skipped
 * until initial loading is complete to prevent saving the initial empty state.
 */
export class StoreSynchronizer<T> {
  /** Current state of the most recent load operation */
  private loadState: {
    isPending: boolean;
    /** Tracks whether the initial load has completed successfully */
    hasLoaded: boolean;
    error: AnyError;
  } = {
    isPending: false,
    hasLoaded: false,
    error: null,
  };
  /** Current state of the most recent save operation */
  private saveState: { isPending: boolean; error: AnyError } = {
    isPending: false,
    error: null,
  };
  /** Reference to the active debounced save function, if debouncing is enabled */
  private debouncedSave: _.DebouncedFunc<
    () => Promise<void> | Promise<null>
  > | null = null;
  /** Subscribers notified when load state changes */
  private loadSubscriber = new Set<() => void>();
  /** Subscribers notified when save state changes */
  private saveSubscriber = new Set<() => void>();
  /** Counter to track the current load operation, used to abort stale operations */
  private loadCounter = 0;
  /** Counter to track the current save operation, used to abort stale operations */
  private saveCounter = 0;

  /**
   * Creates a new StoreSynchronizer instance.
   *
   * Sets up automatic save triggering when the watched store slice changes.
   * The `load()` method must be called manually to perform the initial hydration.
   *
   * @param store - The Zustand store to synchronize
   * @param getter - Async function to load external state into the store
   * @param setter - Function that returns a function to save store state externally
   * @param selector - Function to select the store slice to watch for changes
   * @param equals - Function to compare store slices for change detection
   * @param debounce - Optional debounce delay in milliseconds for saves
   */
  constructor(
    private store: StoreApi<T>,
    private getter: () => Promise<void> | Promise<null>,
    private setter: () => () => Promise<void> | Promise<null>,
    private selector: (state: T) => unknown,
    private equals: (a: unknown, b: unknown) => boolean,
    private debounce: number | undefined,
  ) {
    // Subscribe to store changes and trigger save when the watched slice changes
    // Only affects saves - loads must be triggered manually
    subscribeWithSelector(this.store, this.selector, () => this.save(), {
      equalityFn: this.equals,
    });
  }

  /**
   * Loads data from external source and updates the store.
   *
   * This method:
   * 1. Flushes any pending save to ensure consistency before loading
   * 2. Sets loading state to pending and clears any previous errors
   * 3. Executes the getter function to fetch external state
   * 4. On success: cancels any pending saves, marks as hydrated, clears loading state
   * 5. On failure: captures the error in loading state
   *
   * The `hasLoaded` flag is set to true on successful load, which enables automatic saves.
   * Saves are skipped until the first load completes to prevent saving initial empty state.
   *
   * Can be called multiple times. Each call gets a unique counter, and stale calls
   * (where a newer load started before the old one completed) are automatically aborted.
   *
   * @note Unlike saves, loads are not debounced and are not automatically triggered
   * by store changes. Call this manually when external dependencies change.
   */
  async load() {
    // Ensure any pending save completes before loading to maintain consistency
    await this.flushSave();
    this.loadState = {
      ...this.loadState,
      isPending: true,
      error: null,
    };
    // Increment counter to track this specific load operation
    const currentLoadCount = ++this.loadCounter;
    // Notify subscribers that load has started
    this.loadSubscriber.forEach((subscriber) => subscriber());
    await this.getter()
      .then(() => {
        // Abort if a newer load has started since this one began
        if (currentLoadCount != this.loadCounter) return;
        this.cancelSave();
        this.loadState = {
          hasLoaded: true,
          isPending: false,
          error: null,
        };
      })
      .catch((error) => {
        if (currentLoadCount != this.loadCounter) return; // Abort if a newer load has started
        this.loadState = {
          ...this.loadState,
          isPending: false,
          error,
        };
      })
      .finally(() => {
        if (currentLoadCount != this.loadCounter) return; // Abort if a newer load has started
        this.loadSubscriber.forEach((subscriber) => subscriber());
      });
  }

  /**
   * Triggers a save operation if conditions are met.
   *
   * Save is triggered automatically when the watched store slice changes, but can also
   * be called manually. This method:
   * 1. Checks if hydration has completed and no load is pending (skips if not)
   * 2. Calls the setter function to prepare state - this creates a closure with captured state
   * 3. Wraps the save in state tracking and error handling
   * 4. Debounces if configured, or executes immediately
   *
   * The two-function pattern in the `setter` option ensures that even if the store
   * changes after this method starts but before the save completes, the original
   * state snapshot is used. This prevents race conditions.
   *
   * @note This method is private and called automatically by the store subscription.
   */
  private async save() {
    // Skip if not hydrated or a load is in progress
    if (!this.loadState.hasLoaded || this.loadState.isPending) return;

    // Call setter to prepare the state to save - creates a closure with current state
    // The returned function will use this captured state, even if store changes later
    let save: () => Promise<void> | Promise<null>;
    try {
      save = this.setter();
    } catch (error) {
      this.saveState = {
        isPending: false,
        error: error as AnyError,
      };
      this.saveSubscriber.forEach((subscriber) => subscriber());
      return;
    }
    const saveWrapper = async () => {
      this.saveState = {
        isPending: true,
        error: null,
      };
      const currentSaveCount = ++this.saveCounter;
      this.saveSubscriber.forEach((subscriber) => subscriber());
      await save()
        .then(() => {
          // Abort if a newer save has started since this one began
          if (currentSaveCount != this.saveCounter) return;
          this.saveState = {
            isPending: false,
            error: null,
          };
        })
        .catch((error) => {
          if (currentSaveCount != this.saveCounter) return; // Abort if a newer save has started
          this.saveState = {
            isPending: false,
            error,
          };
        })
        .finally(() => {
          if (currentSaveCount != this.saveCounter) return; // Abort if a newer save has started
          this.saveSubscriber.forEach((subscriber) => subscriber());
        });
    };

    if (this.debounce != undefined) {
      // If debouncing is enabled, cancel any pending debounced save
      this.cancelSave();
      const debouncedSave = _.debounce(saveWrapper, this.debounce);
      this.debouncedSave = debouncedSave;
      await debouncedSave();
    } else {
      // Execute immediately if no debounce is configured
      await saveWrapper();
    }
  }

  /**
   * If a save is currently debounced and pending, executes it immediately without waiting
   * for the debounce delay to elapse.
   *
   * Useful when you need to ensure the latest state is saved before performing another
   * operation (e.g., before a load or before the user navigates away).
   *
   * @note Only has an effect if debouncing is enabled and a save is pending.
   */
  async flushSave() {
    if (this.debouncedSave) await this.debouncedSave.flush();
  }

  /**
   * If a save is currently debounced and pending, cancels it before it executes.
   *
   * Useful for aborting saves when they become irrelevant (e.g., when a new load starts
   * or when the user cancels an action).
   *
   * @note Only has an effect if debouncing is enabled and a save is pending.
   */
  cancelSave() {
    if (this.debouncedSave) this.debouncedSave.cancel();
  }

  /**
   * Subscribes to successful load completions.
   * The listener is called whenever a load operation finishes successfully (not pending, no error).
   *
   * @param listener - Callback function invoked on successful load
   * @returns A function to unsubscribe
   */
  onLoadResolved(listener: () => void) {
    return this.subscribeLoadState(() => {
      const loadState = this.getLoadState();
      if (!loadState.isPending && !loadState.error) {
        listener();
      }
    });
  }

  /**
   * Subscribes to failed load operations.
   * The listener is called whenever a load operation finishes with an error.
   *
   * @param listener - Callback function that receives the error
   * @returns A function to unsubscribe
   */
  onLoadRejected(listener: (error: AnyError) => void) {
    return this.subscribeLoadState(() => {
      const loadState = this.getLoadState();
      if (!loadState.isPending && !!loadState.error) {
        listener(loadState.error);
      }
    });
  }

  /**
   * Subscribes to successful save completions.
   * The listener is called whenever a save operation finishes successfully (not pending, no error).
   *
   * @param listener - Callback function invoked on successful save
   * @returns A function to unsubscribe
   */
  onSaveResolved(listener: () => void) {
    return this.subscribeSaveState(() => {
      const saveState = this.getSaveState();
      if (!saveState.isPending && !saveState.error) {
        listener();
      }
    });
  }

  /**
   * Subscribes to failed save operations.
   * The listener is called whenever a save operation finishes with an error.
   *
   * @param listener - Callback function that receives the error
   * @returns A function to unsubscribe
   */
  onSaveRejected(listener: (error: AnyError) => void) {
    return this.subscribeSaveState(() => {
      const saveState = this.getSaveState();
      if (!saveState.isPending && !!saveState.error) {
        listener(saveState.error);
      }
    });
  }

  /**
   * Subscribes to all load state changes.
   * The listener is called whenever the load state changes (pending, error, or completion).
   *
   * @param listener - Callback function invoked on any load state change
   * @returns A function to unsubscribe
   */
  subscribeLoadState(listener: () => void) {
    this.loadSubscriber.add(listener);
    return () => {
      this.loadSubscriber.delete(listener);
    };
  }

  /**
   * Gets the current load state.
   *
   * @returns The current load state including pending status, error, and hydration status
   */
  getLoadState() {
    return this.loadState;
  }

  /**
   * Subscribes to all save state changes.
   * The listener is called whenever the save state changes (pending, error, or completion).
   *
   * @param listener - Callback function invoked on any save state change
   * @returns A function to unsubscribe
   */
  subscribeSaveState(listener: () => void) {
    this.saveSubscriber.add(listener);
    return () => {
      this.saveSubscriber.delete(listener);
    };
  }

  /**
   * Gets the current save state.
   *
   * @returns The current save state including pending status and error
   */
  getSaveState() {
    return this.saveState;
  }
}
