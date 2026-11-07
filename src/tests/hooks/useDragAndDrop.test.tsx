import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { render } from "@testing-library/react";
import { useCallback, useRef, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const OriginalMutationObserver = globalThis.MutationObserver;

// The drag and drop library creates a MutationObserver per dragAndDrop() call
// and never disconnects it, so counting observer constructions measures how
// often the drag and drop instance was (re-)created.
function stubMutationObserverCounter() {
  const counter = vi.fn(function (callback: MutationCallback) {
    return new OriginalMutationObserver(callback);
  });
  vi.stubGlobal("MutationObserver", counter);
  return counter;
}

function TestList(props: { disabled: boolean; rerenderCount: number }) {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const [values, setValues] = useState(["a", "b", "c"]);
  // Callback options must have a stable identity (e.g. via useCallback),
  // otherwise the options object is never equal between renders:
  const handleDragend = useCallback(() => undefined, []);
  useDragAndDrop(values, setValues, parentRef, {
    dragHandle: ".drag-handle",
    disabled: props.disabled,
    onDragend: handleDragend,
  });
  return (
    <div ref={parentRef}>
      {values.map((value) => (
        <div key={value} className="allow-drag">
          {value}
        </div>
      ))}
      <span>{props.rerenderCount}</span>
    </div>
  );
}

describe("useDragAndDrop", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not re-create the drag and drop instance on re-renders with an inline options object", () => {
    const observerCount = stubMutationObserverCounter();
    const { rerender } = render(
      <TestList disabled={false} rerenderCount={0} />,
    );
    expect(observerCount).toHaveBeenCalledTimes(1);
    for (let i = 1; i <= 10; i++) {
      rerender(<TestList disabled={false} rerenderCount={i} />);
    }
    expect(observerCount).toHaveBeenCalledTimes(1);
  });

  it("re-creates the instance when an option value changes", () => {
    const observerCount = stubMutationObserverCounter();
    const { rerender } = render(
      <TestList disabled={false} rerenderCount={0} />,
    );
    rerender(<TestList disabled={true} rerenderCount={1} />);
    expect(observerCount).toHaveBeenCalledTimes(2);
  });
});
