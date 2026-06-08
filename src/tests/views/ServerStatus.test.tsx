import { Status, fetchLocalizedServerStatus } from "@/api/bethesdaServerStatus";
import { sleep } from "@/utils";
import { ServerStatusRow } from "@/views/home/ServerStatus";
import { RenderResult, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { vi } from "vitest";

const SLEEP_INTERVAL = 50; // milliseconds

async function clickFetchButton(_dom: RenderResult) {
  // Get and click refresh button:
  const fetchButton = screen.getByRole("button"); // dom.container.querySelector("button");
  expect(fetchButton).not.toBeNull();
  expect(fetchButton).toBeInTheDocument();
  await userEvent.click(fetchButton as Element);
}

vi.mock("@/commands/bindings", () => ({
  commands: {
    // important: tell component that it's in debug mode:
    isDebug: vi.fn(() => Promise.resolve(true)),
  },
}));

vi.mock("@/hooks/useTheme", () => ({
  default: vi.fn(() => Promise.resolve("light")),
}));

beforeAll(() => {
  // Mock Zustand store:
  vi.mock("@/stores/settings", () => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useSettingsStore: (fn: any) =>
      fn({
        language: "en",
        theme: "light",
      }),
  }));

  // Mock status API:
  vi.mock("@/api/bethesdaServerStatus", async (importOriginal) => {
    const actual =
      await importOriginal<typeof import("@/api/bethesdaServerStatus")>();
    return {
      Status: actual.Status,
      fetchLocalizedServerStatus: vi.fn(),
    };
  });
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("<ServerStatus> component", () => {
  it("should fetch and display the proper message.", async () => {
    vi.mocked(fetchLocalizedServerStatus).mockResolvedValueOnce({
      status: Status.Operational,
      message: "Funktionsfähig",
    });

    // Render component:
    const dom = render(
      <table>
        <tbody>
          <ServerStatusRow />
        </tbody>
      </table>,
    );

    // Get and click refresh button:
    await clickFetchButton(dom);

    // Wait for the component to fetch and render:
    await sleep(SLEEP_INTERVAL);

    // Check if function was called only once:
    expect(fetchLocalizedServerStatus).toHaveBeenCalledTimes(1);

    // Check if localized "operational" string is displayed:
    const element = await dom.findByText(/Funktionsfähig/);
    expect(element).toBeInTheDocument();
  });

  it("should display error message when Promise rejects.", async () => {
    vi.mocked(fetchLocalizedServerStatus).mockRejectedValueOnce(
      new Error("Mocked error message"),
    );

    // Render component:
    const dom = render(
      <table>
        <tbody>
          <ServerStatusRow />
        </tbody>
      </table>,
    );

    // Get and click refresh button:
    await clickFetchButton(dom);

    // Wait for the component to fetch and render:
    await sleep(SLEEP_INTERVAL);

    // Check if function was called only once:
    expect(fetchLocalizedServerStatus).toHaveBeenCalledTimes(1);

    // Check if error string is displayed:
    const element = await dom.findByText(/home.serverStatus.error/);
    expect(element).toBeInTheDocument();
  });
});
