import { MODAL_EXIT_ANIMATION_MS, ModalPortal } from "@/components/ModalPortal";
import type { ErrorMessageModalData } from "@/components/modals/ErrorMessageModal";
import type { LoadingModalData } from "@/components/modals/LoadingModal";
import { commands } from "@/commands/bindings";
import { useGlobalModals } from "@/hooks/useGlobalModals";
import { updaterService } from "@/services/updater";
import { ModalComponentProps, useModalStore } from "@/stores/modals";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
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

vi.mock("@/components/modals/FirstRunModal", () => ({
  default: (props: ModalComponentProps<void, void>) => (
    <div data-testid="first-run-modal" data-open={props.isOpen} />
  ),
}));

vi.mock("@/components/modals/LoadingModal", () => ({
  default: (props: ModalComponentProps<LoadingModalData, void>) => (
    <div
      data-testid="loading-modal"
      data-open={props.isOpen}
      data-progress={props.data.progress}
    />
  ),
}));

vi.mock("@/components/modals/ErrorMessageModal", () => ({
  default: (props: ModalComponentProps<ErrorMessageModalData, void>) => (
    <div
      data-testid="error-modal"
      data-open={props.isOpen}
      data-reason={String(props.data.reason)}
    />
  ),
}));

const setPrereleaseDismissed = vi.fn();
const settingsState = { prereleaseDismissed: false, setPrereleaseDismissed };

vi.mock("@/stores/settings", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useSettingsStore: (fn: any) => fn(settingsState),
}));

const profilesState = {
  profiles: [{ key: "existing-profile" }],
  setProfiles: vi.fn(),
  setSelectedIndex: vi.fn(),
};

vi.mock("@/stores/profiles", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useProfilesStore: (fn: any) => fn(profilesState),
}));

let updateListener: ((type: string) => void) | undefined;

vi.mock("@/services/updater", () => ({
  updaterService: {
    subscribe: vi.fn((listener: (type: string) => void) => {
      updateListener = listener;
      return () => undefined;
    }),
    getUpdateState: vi.fn(),
  },
}));

function Harness() {
  useGlobalModals();
  return <ModalPortal />;
}

function emitUpdate(state: {
  isPending?: boolean;
  error?: unknown;
  contentLength?: number;
  downloadedBytes?: number;
  percent?: number;
}) {
  vi.mocked(updaterService.getUpdateState).mockReturnValue(
    state as ReturnType<typeof updaterService.getUpdateState>,
  );
  act(() => {
    updateListener?.("update");
  });
}

beforeEach(() => {
  useModalStore.setState({ stack: [] });
  updateListener = undefined;
  vi.mocked(commands.isPrerelease).mockResolvedValue(false);
  setPrereleaseDismissed.mockClear();
  settingsState.prereleaseDismissed = false;
  profilesState.profiles = [{ key: "existing-profile" }];
});

describe("useGlobalModals — prerelease modal", () => {
  it("opens the prerelease modal on a prerelease when not dismissed, and dismissing closes it", async () => {
    vi.mocked(commands.isPrerelease).mockResolvedValue(true);
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
    render(<Harness />);

    await waitFor(() => expect(commands.isPrerelease).toHaveBeenCalled());
    expect(useModalStore.getState().stack).toHaveLength(0);
    expect(screen.queryByText("prereleaseModal.title")).not.toBeInTheDocument();
  });
});

describe("useGlobalModals — first run modal", () => {
  it("opens the first run modal when no profiles exist", async () => {
    profilesState.profiles = [];
    render(<Harness />);

    expect(await screen.findByTestId("first-run-modal")).toBeInTheDocument();
    expect(useModalStore.getState().stack).toHaveLength(1);
  });

  it("does not open the first run modal while the prerelease modal is shown", async () => {
    profilesState.profiles = [];
    vi.mocked(commands.isPrerelease).mockResolvedValue(true);
    render(<Harness />);

    expect(
      await screen.findByText("prereleaseModal.title"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("first-run-modal")).not.toBeInTheDocument();
  });

  it("opens the first run modal on a prerelease when the prerelease modal was dismissed", async () => {
    profilesState.profiles = [];
    settingsState.prereleaseDismissed = true;
    vi.mocked(commands.isPrerelease).mockResolvedValue(true);
    render(<Harness />);

    expect(await screen.findByTestId("first-run-modal")).toBeInTheDocument();
    expect(screen.queryByText("prereleaseModal.title")).not.toBeInTheDocument();
    expect(useModalStore.getState().stack).toHaveLength(1);
  });

  it("does not stack a second first run modal while one is already open", async () => {
    profilesState.profiles = [];
    const { rerender } = render(<Harness />);

    expect(await screen.findByTestId("first-run-modal")).toBeInTheDocument();
    rerender(<Harness />);
    rerender(<Harness />);

    expect(useModalStore.getState().stack).toHaveLength(1);
  });

  it("reopens the first run modal after the previous one was closed", async () => {
    profilesState.profiles = [];
    const { rerender } = render(<Harness />);

    expect(await screen.findByTestId("first-run-modal")).toBeInTheDocument();

    await act(async () => {
      useModalStore.getState().closeAll();
    });
    expect(useModalStore.getState().stack).toHaveLength(0);

    profilesState.profiles = [{ key: "existing-profile" }];
    rerender(<Harness />);
    profilesState.profiles = [];
    rerender(<Harness />);

    expect(await screen.findByTestId("first-run-modal")).toBeInTheDocument();
    expect(useModalStore.getState().stack).toHaveLength(1);
  });
});

describe("useGlobalModals — update progress modal", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function flushClosingRender() {
    act(() => {
      vi.advanceTimersByTime(MODAL_EXIT_ANIMATION_MS);
    });
  }

  it("opens a loading modal on pending, updates it in place, and closes it on finish", () => {
    render(<Harness />);
    expect(updateListener).toBeDefined();

    emitUpdate({
      isPending: true,
      contentLength: 100,
      downloadedBytes: 50,
      percent: 0.5,
    });
    expect(screen.getByTestId("loading-modal")).toHaveAttribute(
      "data-open",
      "true",
    );
    expect(screen.getByTestId("loading-modal")).toHaveAttribute(
      "data-progress",
      "50",
    );
    expect(useModalStore.getState().stack).toHaveLength(1);
    const loadingId = useModalStore.getState().getCurrentId();

    emitUpdate({
      isPending: true,
      contentLength: 100,
      downloadedBytes: 80,
      percent: 0.8,
    });
    expect(screen.getByTestId("loading-modal")).toHaveAttribute(
      "data-progress",
      "80",
    );
    expect(useModalStore.getState().stack).toHaveLength(1);
    expect(useModalStore.getState().getCurrentId()).toBe(loadingId);

    emitUpdate({ isPending: false });
    expect(useModalStore.getState().stack).toHaveLength(0);
    expect(screen.getByTestId("loading-modal")).toHaveAttribute(
      "data-open",
      "false",
    );
    flushClosingRender();
    expect(screen.queryByTestId("loading-modal")).not.toBeInTheDocument();
  });

  it("replaces the loading modal with an error modal on error, and back on pending", () => {
    render(<Harness />);
    expect(updateListener).toBeDefined();

    emitUpdate({ isPending: true, percent: 0.1 });
    expect(screen.getByTestId("loading-modal")).toHaveAttribute(
      "data-open",
      "true",
    );

    emitUpdate({ isPending: false, error: "something failed" });
    expect(screen.getByTestId("error-modal")).toHaveAttribute(
      "data-open",
      "true",
    );
    expect(screen.getByTestId("error-modal")).toHaveAttribute(
      "data-reason",
      "something failed",
    );
    expect(screen.getByTestId("loading-modal")).toHaveAttribute(
      "data-open",
      "false",
    );
    expect(useModalStore.getState().stack).toHaveLength(1);
    flushClosingRender();
    expect(screen.queryByTestId("loading-modal")).not.toBeInTheDocument();

    emitUpdate({ isPending: true, percent: 0.2 });
    expect(screen.getByTestId("loading-modal")).toHaveAttribute(
      "data-open",
      "true",
    );
    expect(screen.getByTestId("error-modal")).toHaveAttribute(
      "data-open",
      "false",
    );
    expect(useModalStore.getState().stack).toHaveLength(1);
    flushClosingRender();
    expect(screen.queryByTestId("error-modal")).not.toBeInTheDocument();
  });
});
