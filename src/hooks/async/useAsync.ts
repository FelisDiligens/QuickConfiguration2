import { useEffect, useMemo, useRef, useState } from "react";

export interface UseAsyncOptions<T, E = Error | string> {
  /** Function that returns a Promise. It is invoked automatically, unless `enabled` is set to `false`. */
  promiseFn: () => Promise<T>;
  /**
   * Enables the automatic invokation of `promiseFn`. Defaults to `true`.
   * If `promiseFn` is pending when it changes from `true` to `false`, it will be cancelled.
   */
  enabled?: boolean;
  /**
   * Watch a list of dependencies and automatically reload (call `promiseFn`) when it changes.
   * If `promiseFn` is pending when the watch list changes, it will be cancelled.
   */
  watch?: React.DependencyList;
  /** Provide initial value for `data`. */
  initialValue?: T;
  /** Called when the promise is resolved. */
  onResolved?: (data: T) => void;
  /** Called when the promise is rejected. */
  onRejected?: (error: E) => void;
  /** Called when the promise is settled (resolved or rejected). */
  onSettled?: () => void;
  /**
   * Called when the promise is cancelled. This happens, when:
   * - manually cancelled by calling `cancel`
   * - `reload` is called while a promise is pending
   * - when the `watch` dependencies change
   * - when the component is unmounted
   */
  onCancelled?: () => void;
}

export interface UseAsyncState<T, E = Error | string> {
  /** Last resolved promise value, maintained when new error arrives. */
  data: T | undefined;
  /** Sets `data` to the passed value, unsets `error` and cancels any pending promise. */
  setData: (data: T) => void;
  /** Rejected promise reason, cleared when new data arrives. */
  error: E | undefined;
  /** Sets `error` to the passed value and cancels any pending promise. */
  setError: (error: E) => void;
  /** true when a promise is currently awaiting settlement. */
  isPending: boolean;
  /**
   * Will be:
   * - `initial` if the `promiseFn` has not been invoked yet.
   * - `pending` if the `promiseFn` is about to be invoked, or is already running.
   * - `error` if the promise of the `promiseFn` rejects. The error is stored in `error`.
   * - `success` if the promise of the `promiseFn` resolved. The data is stored in `data`.
   */
  status: "initial" | "pending" | "success" | "error";
  /** Invokes the `promiseFn` with arguments passed to hook. */
  reload: () => void;
  /** Cancel any pending promise. */
  cancel: () => void;
}

/**
 * React hook that resolves an async function or a function that returns a promise.
 * Immediately calls `promiseFn` on component mount. If you wish to manually invoke it, see `useLazyAsync`.
 *
 * You can call async functions with arguments like this:
 * ```ts
 * const loadTodo = (id: number) =>
 *   fetch(`/api/todos/${id}`).then((res) => res.json());
 *
 * export default function MyComponent() {
 *   const { data, error, isPending } = useAsync(() => loadTodo(1));
 *   // ...
 * }
 * ```
 *
 * If you need more control, you can also pass the `options` object instead:
 * ```ts
 * const loadTodo = (id: number) =>
 *   fetch(`/api/todos/${id}`).then((res) => res.json());
 *
 * // Note how the function signature changes:
 * export default function MyComponent() {
 *   const setTodo = useTodoStore((store) => store.setTodo);
 *   const { data, error, isPending } = useAsync({
 *     promiseFn: () => loadTodo(),
 *     onResolved: setTodo,
 *   });
 *
 *   // ...
 * }
 * ```
 *
 * Often there are conditions that need to be met before one can query a value. Or a value needs to be refetched, when the dependencies change.
 * In that case you can use `enabled` and `watch`:
 * ```ts
 * const loadTodo = (id: number) =>
 *   fetch(`/api/todos/${id}`).then((res) => res.json());
 *
 * export default function MyComponent() {
 *   const { id } = useQueryParams();
 *   const { data, error, isPending } = useAsync({
 *     promiseFn: () => loadTodo(id),
 *     enabled: id != undefined, // only run loadTodo if id isn't undefined or null
 *     watch: [id],              // watch `id` and run loadTodo again when it changes
 *   });
 *
 *   // ...
 * }
 * ```
 *
 * @param options Either an async function, a function that returns a promise, or options for the hook.
 */
export function useAsync<T, E = Error | string>(
  options: UseAsyncOptions<T, E> | (() => Promise<T>),
): UseAsyncState<T, E> {
  const {
    promiseFn,
    enabled,
    watch,
    initialValue,
    onResolved,
    onRejected,
    onSettled,
    onCancelled,
  } = (() => {
    if (typeof options == "function") {
      return {
        promiseFn: options,
        enabled: true,
      };
    } else {
      return {
        ...options,
        enabled: options.enabled != null ? options.enabled : true,
      };
    }
  })();

  const [data, setData] = useState<T | undefined>(initialValue);
  const [error, setError] = useState<E | undefined>(undefined);
  const isInitial = useRef(true);
  const [isPending, setIsPending] = useState(false);
  const isPendingRef = useRef(false);
  const lastCallId = useRef(0);

  const status: UseAsyncState<T>["status"] = useMemo(() => {
    if (isPendingRef.current || (isInitial.current && enabled))
      return "pending";
    if (error) return "error";
    if (data && !isInitial.current) return "success";
    return "initial";
  }, [data, error, isPendingRef.current, isInitial.current, enabled]);

  const dispatch = () => {
    const callId = ++lastCallId.current;

    isPendingRef.current = true;
    setIsPending(true);
    isInitial.current = false;
    setError(undefined);

    promiseFn()
      .then((data) => {
        if (callId !== lastCallId.current) return;
        setData(data);
        setError(undefined);
        if (onResolved) onResolved(data);
      })
      .catch((error) => {
        if (callId !== lastCallId.current) return;
        setError(error);
        if (onRejected) onRejected(error);
      })
      .finally(() => {
        if (callId !== lastCallId.current) return;
        isPendingRef.current = false;
        setIsPending(false);
        if (onSettled) onSettled();
      });
  };

  const reload = () => {
    if (isPendingRef.current) cancel();
    dispatch();
  };

  const cancel = () => {
    if (!isPendingRef.current) return;
    lastCallId.current++;
    isPendingRef.current = false;
    setIsPending(false);
    if (onCancelled) onCancelled();
  };

  useEffect(() => {
    if (!isPendingRef.current && enabled) {
      dispatch();
    }
    return cancel;
  }, [...(watch || []), enabled]);

  return {
    data,
    setData: (data: T) => {
      cancel();
      setData(data);
      setError(undefined);
    },
    error,
    setError: (error: E) => {
      cancel();
      setError(error);
    },
    isPending: isPending || (isInitial.current && enabled),
    status,
    reload,
    cancel,
  };
}
