import { ModalPortal } from "@/components/ModalPortal";
import { commands } from "@/commands/bindings";
import { useGlobalModals } from "@/hooks/useGlobalModals";
import { useModalStore } from "@/stores/modals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  Trans: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
}));

vi.mock("@/info", () => ({ info: { version: "0.0.0-test" } }));

vi.mock(import("@/commands/bindings"), async (importOriginal) => {
  const originalModule = await importOriginal();
  return {
    ...originalModule,
    commands: {
      ...originalModule.commands,
      isPrerelease: vi.fn(),
    },
  };
});

const setPrereleaseDismissed = vi.fn();

vi.mock("@/stores/settings", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useSettingsStore: (fn: any) =>
    fn({ prereleaseDismissed: false, setPrereleaseDismissed }),
}));

vi.mock("@/stores/profiles", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useProfilesStore: (fn: any) =>
    fn({
      profiles: [{ key: "existing-profile" }],
      setProfiles: vi.fn(),
      setSelectedIndex: vi.fn(),
    }),
}));

vi.mock("@/services/updater", () => ({
  updaterService: {
    subscribe: vi.fn(() => () => undefined),
    getUpdateState: vi.fn(),
  },
}));

function Harness() {
  useGlobalModals();
  return <ModalPortal />;
}

beforeEach(() => {
  useModalStore.setState({ stack: [] });
  vi.mocked(commands.isPrerelease).mockResolvedValue(true);
  setPrereleaseDismissed.mockClear();
});

describe("useGlobalModals", () => {
  it("opens the prerelease modal on a prerelease when not dismissed, and dismissing closes it", async () => {
    render(<Harness />);

    expect(
      await screen.findByText("prereleaseModal.title"),
    ).toBeInTheDocument();
    expect(useModalStore.getState().stack).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "common.ok" }));

    await waitFor(() => expect(useModalStore.getState().stack).toHaveLength(0));
    expect(setPrereleaseDismissed).toHaveBeenCalledWith(true);
  });

  it("does not open the prerelease modal on a stable version", async () => {
    vi.mocked(commands.isPrerelease).mockResolvedValue(false);
    render(<Harness />);

    await waitFor(() => expect(commands.isPrerelease).toHaveBeenCalled());
    expect(useModalStore.getState().stack).toHaveLength(0);
    expect(screen.queryByText("prereleaseModal.title")).not.toBeInTheDocument();
  });
});
