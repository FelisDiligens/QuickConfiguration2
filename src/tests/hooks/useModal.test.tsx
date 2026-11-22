import { ModalPortal } from "@/components/ModalPortal";
import { confirmModal, loadingModal, messageModal } from "@/hooks/useModal";
import { useModalStore } from "@/stores/modals";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

beforeEach(() => {
  useModalStore.setState({ stack: [] });
});

describe("confirmModal / messageModal wrappers", () => {
  it("confirmModal resolves with true when Yes is clicked", async () => {
    render(<ModalPortal />);
    let promise: Promise<boolean | undefined> = Promise.resolve(undefined);
    act(() => {
      promise = confirmModal({ title: "title", children: "text" });
    });

    fireEvent.click(screen.getByRole("button", { name: "common.yes" }));

    await expect(promise).resolves.toBe(true);
    expect(useModalStore.getState().stack).toHaveLength(0);
  });

  it("confirmModal resolves with undefined when No is clicked", async () => {
    render(<ModalPortal />);
    let promise: Promise<boolean | undefined> = Promise.resolve(undefined);
    act(() => {
      promise = confirmModal({ title: "title", children: "text" });
    });

    fireEvent.click(screen.getByRole("button", { name: "common.no" }));

    await expect(promise).resolves.toBeUndefined();
    expect(useModalStore.getState().stack).toHaveLength(0);
  });

  it("messageModal resolves when OK is clicked", async () => {
    render(<ModalPortal />);
    let promise: Promise<void> = Promise.resolve();
    act(() => {
      promise = messageModal({ title: "title", children: "text" });
    });

    fireEvent.click(screen.getByRole("button", { name: "common.ok" }));

    await expect(promise).resolves.toBeUndefined();
    expect(useModalStore.getState().stack).toHaveLength(0);
  });
});

describe("loadingModal", () => {
  it("open() pushes a LoadingModal on top of the stack", () => {
    const modal = loadingModal();
    modal.open({ label: "working" });

    const state = useModalStore.getState();
    expect(state.stack).toHaveLength(1);
    expect(state.isAnyOpen()).toBe(true);
    expect(state.getCurrent()?.data).toEqual({ label: "working" });
  });

  it("update() after open() replaces the data of the same stack entry in place", () => {
    const modal = loadingModal();
    modal.open({ label: "a" });
    const id = useModalStore.getState().getCurrentId();

    modal.update({ label: "b", progress: 50 });

    const state = useModalStore.getState();
    expect(state.stack).toHaveLength(1);
    expect(state.getCurrent()?.id).toBe(id);
    expect(state.getCurrent()?.data).toEqual({ label: "b", progress: 50 });
  });

  it("update() before open() opens the modal with the given data", () => {
    const modal = loadingModal();
    modal.update({ label: "first", progress: 10 });

    const state = useModalStore.getState();
    expect(state.stack).toHaveLength(1);
    expect(state.getCurrent()?.data).toEqual({ label: "first", progress: 10 });
  });

  it("open() is idempotent on the same instance (a second call does not push another modal)", () => {
    const modal = loadingModal();
    modal.open({ label: "a" });
    modal.open({ label: "b" });

    const state = useModalStore.getState();
    expect(state.stack).toHaveLength(1);
    expect(state.getCurrent()?.data).toEqual({ label: "a" });
  });

  it("close() after open() removes the modal from the stack and resolves", async () => {
    const modal = loadingModal();
    modal.open({ label: "a" });

    await expect(modal.close()).resolves.toBeUndefined();
    expect(useModalStore.getState().stack).toHaveLength(0);
    expect(useModalStore.getState().isAnyOpen()).toBe(false);
  });

  it("close() before open() resolves immediately and leaves the stack empty", async () => {
    const modal = loadingModal();

    await expect(modal.close()).resolves.toBeUndefined();
    expect(useModalStore.getState().stack).toHaveLength(0);
  });

  it("close() is idempotent (a second call resolves and changes nothing)", async () => {
    const modal = loadingModal();
    modal.open({ label: "a" });
    await modal.close();

    await expect(modal.close()).resolves.toBeUndefined();
    expect(useModalStore.getState().stack).toHaveLength(0);
  });

  it("update() after close() is a no-op and does not re-open the modal", async () => {
    const modal = loadingModal();
    modal.open({ label: "a" });
    await modal.close();

    modal.update({ label: "b" });

    expect(useModalStore.getState().stack).toHaveLength(0);
  });

  it("renders label and 0-100 progress in the portal and closes", async () => {
    render(<ModalPortal />);
    const modal = loadingModal();
    act(() => {
      modal.open({ label: "working" });
    });
    expect(screen.getByText("working")).toBeInTheDocument();

    act(() => {
      modal.update({ label: "working", progress: 50 });
    });
    expect(screen.getByText("50%")).toBeInTheDocument();

    await act(async () => {
      await modal.close();
    });
    expect(useModalStore.getState().stack).toHaveLength(0);
    expect(screen.queryByText("working")).not.toBeInTheDocument();
  });
});
