import { useMemo, useRef, useState } from "react";

export interface UseLazyAsyncOptions<
  T,
  E = Error | string,
  A extends unknown[] = unknown[],
> {
  /** Function that returns a Promise. It is invoked when `run` is called. */
  promiseFn: (...args: A) => Promise<T>;
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
   * - `run` is called while a promise is pending
   */
  onCancelled?: () => void;
}

export interface UseLazyAsyncState<
  T,
  E = Error | string,
  A extends unknown[] = unknown[],
> {
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
  /** Invokes the `promiseFn` with new arguments. */
  run: (...args: A) => void;
  /**
   * Cancel any pending promise.
   * Any result returned by an already invoked `promiseFn` will be ignored and thrown away.
   */
  cancel: () => void;
}

export type UseLazyAsyncPromiseFn<
  T,
  E = Error | string,
  A extends unknown[] = unknown[],
> = UseLazyAsyncOptions<T, E, A>["promiseFn"];

/**
 * React hook that resolves an async function or a function that returns a promise.
 * Async function can be called using `run`. If you wish to immediately invoke it, see `useAsync`.
 * Note that if the hook unmounts, any pending promise will *not* be cancelled.
 *
 * Example:
 * ```ts
 * const loadTodo = (id: number) =>
 *   fetch(`/api/todos/${id}`).then((res) => res.json());
 *
 * const updateTodo = (id: number, todo: Todo) => {
 *   return fetch(`/api/todos/${id}`, {
 *     method: "POST",
 *     body: JSON.stringify(todo),
 *   }).then((res) => res.json());
 * }
 *
 * export default function MyComponent() {
 *   const { data, setData, error, setError, ...loadState } =
 *     useAsync(() => loadTodo(1));
 *
 *   const { run, ...updateState } = useLazyAsync({
 *     promiseFn: updateTodo,
 *     onResolved: setData,
 *     onRejected: setError,
 *   });
 *   const isPending = loadState.isPending || updateState.isPending;
 *
 *   // ...
 *
 *   const handleTodoUpdate = () => {
 *     // Run `promiseFn` with arguments:
 *     run(1, { ...data, text: "Buy bread" });
 *   };
 *
 *   // ...
 * }
 * ```
 *
 * @param options Either an async function, a function that returns a promise, or options for the hook.
 */
export function useLazyAsync<
  T,
  E = Error | string,
  A extends unknown[] = unknown[],
>(
  options: UseLazyAsyncOptions<T, E, A> | ((...args: A) => Promise<T>),
): UseLazyAsyncState<T, E, A> {
  const {
    promiseFn,
    initialValue,
    onResolved,
    onRejected,
    onSettled,
    onCancelled,
  } = (() => {
    if (typeof options == "function") {
      return { promiseFn: options };
    } else {
      return options;
    }
  })();

  const [data, setData] = useState<T | undefined>(initialValue);
  const [error, setError] = useState<E | undefined>(undefined);
  const isInitial = useRef(true);
  const [isPending, setIsPending] = useState(false);
  const isPendingRef = useRef(false);
  const lastCallId = useRef(0);

  const status: UseLazyAsyncState<T>["status"] = useMemo(() => {
    if (isPendingRef.current) return "pending";
    if (error) return "error";
    if (data && !isInitial.current) return "success";
    return "initial";
  }, [data, error, isPendingRef.current, isInitial.current]);

  const dispatch = (args: A) => {
    const callId = ++lastCallId.current;

    isPendingRef.current = true;
    setIsPending(true);
    isInitial.current = false;
    setError(undefined);

    promiseFn(...args)
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

  const run = (...args: A) => {
    if (isPendingRef.current) cancel();
    dispatch(args);
  };

  const cancel = () => {
    if (!isPendingRef.current) return;
    lastCallId.current++;
    isPendingRef.current = false;
    setIsPending(false);
    if (onCancelled) onCancelled();
  };

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
    isPending,
    status,
    run,
    cancel,
  };
}
