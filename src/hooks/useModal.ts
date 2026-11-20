import {
  ConfirmModal,
  ConfirmModalData,
} from "@/components/modals/ConfirmModal";
import {
  MessageModal,
  MessageModalData,
} from "@/components/modals/MessageModal";
import { ModalComponent, useModalStore } from "@/stores/modals";

/**
 * Opens a modal on top of the modal stack and returns a promise for its result.
 * Can be called from anywhere (components, hooks, services, event handlers) —
 * no local `show` state or pre-mounted `<Modal>` is needed.
 *
 * Only the most recently opened modal is visible; when it closes, the previous
 * modal resumes with its state intact. A modal can itself open another modal
 * (e.g. a form modal opening a confirmation) by simply awaiting this function.
 *
 * @param component a component receiving `ModalComponentProps<TData, TResult>`
 * @param data passed to the component as `props.data`
 * @returns a promise resolving with the value passed to `props.close(result)`,
 *          or `undefined` when the modal is cancelled via `props.cancel()`
 *
 * @example
 * ```ts
 * // simple confirmation:
 * const ok = await openModal(ConfirmModal, { title: t("..."), text: t("...") });
 * if (ok) await deleteThing();
 *
 * // opened from within another modal — stacks automatically:
 * const path = await openModal(SelectDetectedGamePathModal, undefined);
 * if (path) setGamePath(path);
 * ```
 */
export function openModal<TData, TResult>(
  component: ModalComponent<TData, TResult>,
  data: TData,
): Promise<TResult | undefined> {
  return useModalStore.getState().open(component, data);
}

/**
 * Opens a {@link ConfirmModal} with a Yes/No choice.
 * @returns resolves with `true` on Yes, `undefined` on No / cancel
 *
 * @example
 * ```ts
 * const ok = await confirmModal({ title: t("..."), children: t("...") });
 * if (ok) await deleteThing();
 * ```
 */
export function confirmModal(
  data: ConfirmModalData,
): Promise<boolean | undefined> {
  return openModal(ConfirmModal, data);
}

/**
 * Opens a {@link MessageModal} with a single OK button.
 * @returns resolves when the modal is closed
 */
export function messageModal(data: MessageModalData): Promise<void> {
  return openModal(MessageModal, data);
}

/**
 * React hook variant of {@link openModal} for components.
 * @returns `openModal`, the store's `close` / `closeAll`, and `isAnyOpen`
 *          (whether at least one modal is currently on the stack)
 */
export function useModal() {
  const isAnyOpen = useModalStore((store) => store.isAnyOpen());
  const close = useModalStore((store) => store.close);
  const closeAll = useModalStore((store) => store.closeAll);
  return { openModal, close, closeAll, isAnyOpen };
}
