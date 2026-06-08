import { tearDown } from "@formkit/drag-and-drop";
import {
  dragAndDrop,
  ReactDragAndDropConfig,
} from "@formkit/drag-and-drop/react";
import { Dispatch, RefObject, SetStateAction, useEffect } from "react";

// Compare usage of dragAndDrop and tearDown with:
// https://github.com/formkit/drag-and-drop/blob/3d10d1bc63f65556ed3628f49d88042ffa6e4538/src/react/index.ts#L94

/**
 * Hook for adding drag and drop/sortable support to a reactive list of items.
 */
export function useDragAndDrop<E extends HTMLElement, T = unknown>(
  values: T[],
  setValues: Dispatch<SetStateAction<T[]>>,
  parentRef: RefObject<E | null>,
  options: Partial<
    ReactDragAndDropConfig<RefObject<E | null> | HTMLElement, T[]>
  > = {},
) {
  useEffect(() => {
    dragAndDrop({
      parent: parentRef,
      state: [values, setValues],
      ...options,
    });
  }, [parentRef, values, options]);

  useEffect(() => {
    return () => {
      if (parentRef.current) {
        tearDown(parentRef.current);
      }
    };
  }, [parentRef]);
}
