import { ComponentType, ReactNode, createElement } from "react";
import { create } from "zustand";

/**
 * Props that every dynamic modal component receives from the {@link ModalPortal}.
 *
 * - `isOpen` is `true` only while the modal is the top of the modal stack (the
 *   most recently opened modal). Suspended modals stay mounted with
 *   `isOpen=false`, so their local state is preserved while another modal is
 *   shown on top. Pass it to react-bootstrap's `<Modal show={...}>`.
 * - `data` is the value passed as the second argument to `open` / `openModal`.
 * - `close(result)` closes this modal and resolves the `openModal(...)`
 *   promise with `result`.
 * - `cancel()` closes this modal and resolves the promise with `undefined`.
 *   Use it for the X button, ESC and backdrop clicks.
 *
 * @example
 * ```tsx
 * function ConfirmModal(props: ModalComponentProps<{ text: string }, boolean>) {
 *   return (
 *     <Modal show={props.isOpen} onHide={props.cancel} backdrop="static" centered>
 *       <Modal.Body>{props.data.text}</Modal.Body>
 *       <Modal.Footer>
 *         <Button onClick={() => props.close(true)}>Yes</Button>
 *         <Button onClick={props.cancel}>No</Button>
 *       </Modal.Footer>
 *     </Modal>
 *   );
 * }
 * ```
 */
export interface ModalComponentProps<TData, TResult> {
  isOpen: boolean;
  data: TData;
  close: (result: TResult) => void;
  cancel: () => void;
}

/**
 * A component that can be opened as a dynamic modal via `openModal(...)`.
 * It receives {@link ModalComponentProps} from the {@link ModalPortal}.
 */
export type ModalComponent<TData = void, TResult = void> = ComponentType<
  ModalComponentProps<TData, TResult>
>;

/**
 * Internal helpers passed by the {@link ModalPortal} to a {@link ModalEntry}'s
 * `render` function. `close` / `cancel` are pre-bound to the entry's id.
 */
export interface ModalRenderHelpers {
  isOpen: boolean;
  close: (result: unknown) => void;
  cancel: () => void;
}

/**
 * One entry of the modal stack. Created by `open`, rendered by the
 * {@link ModalPortal}; `resolve` settles the promise returned by `open`.
 * `data` can be replaced via `updateById` (the portal re-renders the modal
 * with the new `data`).
 */
export interface ModalEntry {
  id: string;
  data: unknown;
  render: (helpers: ModalRenderHelpers) => ReactNode;
  resolve: (result: unknown) => void;
}

/**
 * Zustand store backing the dynamic modal system.
 *
 * Modals form a stack (LIFO): `open` pushes a new modal on top and the
 * {@link ModalPortal} shows only the top entry; when it closes, the modal
 * below resumes with its state intact. Each `open` returns a promise that
 * resolves with the `close(result)` value (or `undefined` on `cancel`).
 *
 * In most cases you don't need this store directly — use `openModal` /
 * `useModal` from `@/hooks/useModal` instead.
 */
export interface ModalsStore {
  /** The modal stack; the last element is the currently visible modal. */
  stack: ModalEntry[];
  /** Returns whether a modal with the given `id` is currently on the stack. */
  has: (id: string) => boolean;
  /** Returns the stack entry with the given `id`, or `undefined` if not found. */
  getById: (id: string) => ModalEntry | undefined;
  /** Returns the top (currently visible) stack entry, or `undefined` when the stack is empty. */
  getCurrent: () => ModalEntry | undefined;
  /** Returns the id of the top (currently visible) modal, or `undefined` when the stack is empty. */
  getCurrentId: () => string | undefined;
  /** Returns whether any modal is currently on the stack. */
  isAnyOpen: () => boolean;
  /**
   * Pushes a modal onto the stack and returns a promise for its result.
   * @param component the modal component (receives {@link ModalComponentProps})
   * @param data passed through to the component as `props.data`
   * @returns resolves with the `close(result)` value, or `undefined` on `cancel`
   *
   * @example
   * ```ts
   * const path = await openModal(SelectDetectedGamePathModal, undefined);
   * if (path) applyPath(path);
   * ```
   */
  open: <TData, TResult>(
    component: ModalComponent<TData, TResult>,
    data: TData,
  ) => Promise<TResult | undefined>;
  /**
   * Closes the top modal, resolving its promise with `result`.
   * No-op when the stack is empty.
   */
  close: (result?: unknown) => void;
  /**
   * Closes a specific modal by id, even if it is not the top one (e.g. to
   * retract a queued confirmation). No-op for unknown ids.
   */
  closeById: (id: string, result?: unknown) => void;
  /**
   * Replaces the `data` of an open modal (e.g. to update a progress label).
   * The modal component re-renders with the new `data`. No-op for unknown ids.
   */
  updateById: (id: string, data: unknown) => void;
  /** Closes all modals, resolving all pending promises with `undefined`. */
  closeAll: () => void;
}

/**
 * The zustand store instance. Prefer `openModal` / `useModal`
 * (`@/hooks/useModal`) over accessing this directly; use
 * `useModalStore.getState()` for imperative access outside of React
 * (e.g. in event handlers or services).
 */
export const useModalStore = create<ModalsStore>()((set, get) => ({
  stack: [],
  has: (id) => get().getById(id) !== undefined,
  getById: (id) => get().stack.find((e) => e.id === id),
  getCurrent: () => get().stack.at(-1),
  getCurrentId: () => get().getCurrent()?.id,
  isAnyOpen: () => get().stack.length > 0,
  open: <TData, TResult>(
    component: ModalComponent<TData, TResult>,
    data: TData,
  ): Promise<TResult | undefined> => {
    let resolvePromise: (result: TResult | undefined) => void = () => undefined;
    const promise = new Promise<TResult | undefined>((resolve) => {
      resolvePromise = resolve;
    });
    const entry: ModalEntry = {
      id: crypto.randomUUID(),
      data,
      render: ({ isOpen, close, cancel }) =>
        createElement(component, {
          isOpen,
          data: entry.data as TData,
          close,
          cancel,
        }),
      resolve: (result) => resolvePromise(result as TResult | undefined),
    };
    set({ stack: [...get().stack, entry] });
    return promise;
  },
  close: (result) => {
    const id = get().getCurrentId();
    if (id != undefined) get().closeById(id, result);
  },
  closeById: (id, result) => {
    const entry = get().getById(id);
    if (!entry) return;
    set({ stack: get().stack.filter((e) => e.id !== id) });
    entry.resolve(result);
  },
  updateById: (id, data) => {
    const entry = get().getById(id);
    if (!entry) return;
    entry.data = data;
    set({ stack: [...get().stack] });
  },
  closeAll: () => {
    const entries = get().stack;
    set({ stack: [] });
    for (const entry of entries) entry.resolve(undefined);
  },
}));
