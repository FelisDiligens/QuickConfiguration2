import { ModalPortal } from "@/components/ModalPortal";
import SelectDetectedGamePathModal from "@/components/modals/SelectDetectedGamePathModal";
import { commands } from "@/commands/bindings";
import { openModal } from "@/hooks/useModal";
import { useModalStore } from "@/stores/modals";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock(import("@/commands/bindings"), async (importOriginal) => {
  const originalModule = await importOriginal();
  return {
    ...originalModule,
    commands: {
      ...originalModule.commands,
      detectGamePath: vi.fn(),
    },
  };
});

const DETECTED_PATHS = ["C:\\Fallout76", "D:\\Games\\Fallout76"];

beforeEach(() => {
  useModalStore.setState({ stack: [] });
  vi.mocked(commands.detectGamePath).mockResolvedValue(DETECTED_PATHS);
});

describe("SelectDetectedGamePathModal via openModal", () => {
  it("resolves with the selected path when accepted", async () => {
    render(<ModalPortal />);
    let promise: Promise<string | undefined> = Promise.resolve(undefined);
    act(() => {
      promise = openModal(SelectDetectedGamePathModal, undefined);
    });

    const selectButton = await screen.findByRole("button", {
      name: "profiles.autoDetectGamePathModal.selectButton",
    });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "1" } });
    fireEvent.click(selectButton);

    await expect(promise).resolves.toBe(DETECTED_PATHS[1]);
    expect(useModalStore.getState().stack).toHaveLength(0);
  });

  it("resolves with undefined when closed", async () => {
    render(<ModalPortal />);
    let promise: Promise<string | undefined> = Promise.resolve(undefined);
    act(() => {
      promise = openModal(SelectDetectedGamePathModal, undefined);
    });

    const closeButton = await screen.findByRole("button", {
      name: "profiles.autoDetectGamePathModal.closeButton",
    });
    fireEvent.click(closeButton);

    await expect(promise).resolves.toBeUndefined();
    expect(useModalStore.getState().stack).toHaveLength(0);
  });
});
