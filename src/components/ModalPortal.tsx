import { ModalEntry, useModalStore } from "@/stores/modals";
import { Fragment, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * How long (in ms) a closed modal stays mounted with `isOpen=false` before it
 * is removed from the DOM, so that react-bootstrap's fade-out animation can
 * play. Single place to adjust the delay.
 */
export const MODAL_EXIT_ANIMATION_MS = 300;

/**
 * Renders the dynamic modal stack (see `@/stores/modals`) into `document.body`.
 * Mount exactly once near the app root (currently in `Layout.tsx` → `Globals`).
 *
 * All stack entries stay mounted and only the top entry receives `isOpen=true`,
 * so suspended modals keep their React state while another modal is shown on
 * top. Entries that were just closed are kept mounted for
 * {@link MODAL_EXIT_ANIMATION_MS} with `isOpen=false` to allow the exit
 * animation, then removed.
 *
 * To open a modal, use `openModal` / `useModal` from `@/hooks/useModal`.
 */
export function ModalPortal() {
  const stack = useModalStore((store) => store.stack);
  const [closing, setClosing] = useState<ModalEntry[]>([]);
  const [previousStack, setPreviousStack] = useState(stack);
  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  // Detect entries that left the stack during render (the conditional setState
  // makes React re-render before committing): a closed entry must stay in the
  // rendered output across the commit where it leaves the stack. Otherwise the
  // modal component would be unmounted and immediately re-mounted with
  // isOpen=false, and a react-bootstrap <Modal show={false}> on a fresh mount
  // never plays its exit transition — the dialog would vanish instantly
  // instead of fading out:
  if (previousStack !== stack) {
    const currentIds = new Set(stack.map((entry) => entry.id));
    const removed = previousStack.filter((entry) => !currentIds.has(entry.id));
    setPreviousStack(stack);
    if (removed.length > 0) setClosing((current) => [...current, ...removed]);
  }

  // Remove closing entries from the DOM once the exit animation has played:
  useEffect(() => {
    for (const entry of closing) {
      if (timersRef.current.has(entry.id)) continue;
      const timer = setTimeout(() => {
        timersRef.current.delete(entry.id);
        setClosing((current) => current.filter((e) => e.id !== entry.id));
      }, MODAL_EXIT_ANIMATION_MS);
      timersRef.current.set(entry.id, timer);
    }
  }, [closing]);

  useEffect(
    () => () => {
      for (const timer of timersRef.current.values()) clearTimeout(timer);
    },
    [],
  );

  const activeId = useModalStore((store) => store.getCurrentId());

  function renderEntry(entry: ModalEntry) {
    return (
      <Fragment key={entry.id}>
        {entry.render({
          isOpen: entry.id === activeId,
          close: (result) =>
            useModalStore.getState().closeById(entry.id, result),
          cancel: () => useModalStore.getState().closeById(entry.id),
        })}
      </Fragment>
    );
  }

  // Single flattened list: React namespaces keys per array child, so rendering
  // two separate .map() arrays would unmount/re-mount an entry that moves from
  // `stack` to `closing` (breaking the exit animation) even when it stays in
  // the rendered output across the commit:
  const renderList = [...closing, ...stack];
  return createPortal(<>{renderList.map(renderEntry)}</>, document.body);
}
