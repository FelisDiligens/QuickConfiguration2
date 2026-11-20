import { MODAL_EXIT_ANIMATION_MS, ModalPortal } from "@/components/ModalPortal";
import { ModalComponentProps, useModalStore } from "@/stores/modals";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { vi } from "vitest";

interface StubData {
  testId: string;
  initialValue?: string;
}

function StubModal(props: ModalComponentProps<StubData, string>) {
  const [value, setValue] = useState(props.data.initialValue ?? "");
  return (
    <div data-testid={props.data.testId} data-open={props.isOpen}>
      <input
        data-testid={`${props.data.testId}-input`}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <button
        data-testid={`${props.data.testId}-close`}
        onClick={() => props.close(`closed:${props.data.testId}`)}
      />
      <button
        data-testid={`${props.data.testId}-cancel`}
        onClick={() => props.cancel()}
      />
    </div>
  );
}

beforeEach(() => {
  useModalStore.setState({ stack: [] });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("<ModalPortal />", () => {
  it("renders an opened modal as open", () => {
    render(<ModalPortal />);
    act(() => {
      void useModalStore.getState().open(StubModal, { testId: "modal-a" });
    });
    expect(screen.getByTestId("modal-a")).toHaveAttribute("data-open", "true");
  });

  it("shows only the top modal; suspended modals stay mounted with isOpen=false and keep their state", async () => {
    render(<ModalPortal />);
    const promises: Promise<string | undefined>[] = [];
    act(() => {
      promises.push(
        useModalStore.getState().open(StubModal, {
          testId: "modal-a",
          initialValue: "A",
        }),
      );
      promises.push(
        useModalStore.getState().open(StubModal, { testId: "modal-b" }),
      );
    });

    expect(screen.getByTestId("modal-a")).toHaveAttribute("data-open", "false");
    expect(screen.getByTestId("modal-b")).toHaveAttribute("data-open", "true");

    fireEvent.change(screen.getByTestId("modal-a-input"), {
      target: { value: "changed" },
    });

    fireEvent.click(screen.getByTestId("modal-b-close"));
    await expect(promises[1]).resolves.toBe("closed:modal-b");

    expect(screen.getByTestId("modal-a")).toHaveAttribute("data-open", "true");
    expect(screen.getByTestId("modal-a-input")).toHaveValue("changed");

    act(() => {
      useModalStore.getState().close("finish");
    });
    await expect(promises[0]).resolves.toBe("finish");
  });

  it("resolves with undefined when the top modal is cancelled", async () => {
    render(<ModalPortal />);
    let promise: Promise<string | undefined> = Promise.resolve(undefined);
    act(() => {
      promise = useModalStore.getState().open(StubModal, { testId: "modal-a" });
    });

    fireEvent.click(screen.getByTestId("modal-a-cancel"));

    await expect(promise).resolves.toBeUndefined();
    expect(useModalStore.getState().stack).toHaveLength(0);
  });

  it("keeps a closed modal rendered with isOpen=false for MODAL_EXIT_ANIMATION_MS, then removes it", () => {
    vi.useFakeTimers();
    render(<ModalPortal />);
    act(() => {
      void useModalStore.getState().open(StubModal, { testId: "modal-a" });
    });
    expect(screen.getByTestId("modal-a")).toHaveAttribute("data-open", "true");

    act(() => {
      useModalStore.getState().close("done");
    });
    expect(screen.getByTestId("modal-a")).toHaveAttribute("data-open", "false");

    act(() => {
      vi.advanceTimersByTime(MODAL_EXIT_ANIMATION_MS);
    });
    expect(screen.queryByTestId("modal-a")).not.toBeInTheDocument();
  });

  it("hands visibility back to the modal below when the top one closes", () => {
    vi.useFakeTimers();
    render(<ModalPortal />);
    act(() => {
      void useModalStore.getState().open(StubModal, { testId: "modal-a" });
      void useModalStore.getState().open(StubModal, { testId: "modal-b" });
    });

    act(() => {
      useModalStore.getState().close("done");
    });

    expect(screen.getByTestId("modal-a")).toHaveAttribute("data-open", "true");
    expect(screen.getByTestId("modal-b")).toHaveAttribute("data-open", "false");

    act(() => {
      vi.advanceTimersByTime(MODAL_EXIT_ANIMATION_MS);
    });
    expect(screen.queryByTestId("modal-b")).not.toBeInTheDocument();
    expect(screen.getByTestId("modal-a")).toHaveAttribute("data-open", "true");
  });
});
