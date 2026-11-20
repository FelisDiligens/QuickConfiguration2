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
 * top. Entries that were just closed are rendered for
 * {@link MODAL_EXIT_ANIMATION_MS} with `isOpen=false` to allow the exit
 * animation, then removed.
 *
 * To open a modal, use `openModal` / `useModal` from `@/hooks/useModal`.
 */
export function ModalPortal() {
  const stack = useModalStore((store) => store.stack);
  const [closing, setClosing] = useState<ModalEntry[]>([]);
  const previousStackRef = useRef<ModalEntry[]>([]);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Keep entries that were just closed mounted (with isOpen=false) for a short
  // time, so that the modal's exit animation can play:
  useEffect(() => {
    const previous = previousStackRef.current;
    previousStackRef.current = stack;
    const currentIds = new Set(stack.map((entry) => entry.id));
    const removed = previous.filter((entry) => !currentIds.has(entry.id));
    if (removed.length === 0) return;
    setClosing((current) => [...current, ...removed]);
    const timer = setTimeout(() => {
      setClosing((current) =>
        current.filter((entry) => !removed.some((r) => r.id === entry.id)),
      );
    }, MODAL_EXIT_ANIMATION_MS);
    timersRef.current.push(timer);
  }, [stack]);

  useEffect(
    () => () => {
      for (const timer of timersRef.current) clearTimeout(timer);
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

  return createPortal(
    <>
      {closing.map(renderEntry)}
      {stack.map(renderEntry)}
    </>,
    document.body,
  );
}
