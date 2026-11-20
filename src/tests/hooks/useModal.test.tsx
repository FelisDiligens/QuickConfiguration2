import { ModalPortal } from "@/components/ModalPortal";
import { confirmModal, messageModal } from "@/hooks/useModal";
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
