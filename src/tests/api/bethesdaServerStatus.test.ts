import { Status, fetchLocalizedServerStatus } from "@/api/bethesdaServerStatus";
import { vi } from "vitest";

// Truncated response from "https://status.bethesda.net/en/status/api/statuses"
const bethesdaStatusResponse = JSON.stringify({
  components: [
    {
      id: "m39k311rzvkg",
      name: "Fallout 76",
      status: "operational",
      created_at: "2018-11-12T09:11:48.315-05:00",
      updated_at: "2024-01-30T12:50:50.468-05:00",
      position: 8,
      description: null,
      showcase: true,
      start_date: null,
      group_id: "b4fdxf1pnz4v",
      page_id: "p6r5nl77dwjf",
      group: false,
      only_show_if_degraded: false,
    },
  ],
});

// Truncated response from "https://api.locize.app/657e9e0e-8225-4266-88dd-75f047f1a2b3/live/en/status"
const locizeEnglishResponse = JSON.stringify({
  statusKey: {
    degraded: "Degraded Performance",
    information: "Information/No Impact",
    maintenance: "Maintenance",
    major: "Outage",
    operational: "Operational",
    partial: "Partial Outage",
    title: "Service Status Key",
  },
});

// Truncated response from "https://api.locize.app/657e9e0e-8225-4266-88dd-75f047f1a2b3/live/de/status"
const locizeGermanResponse = JSON.stringify({
  statusKey: {
    degraded: "Herabgesetzte Performance",
    information: "Informationen/Keine Auswirkungen",
    maintenance: "Wartung",
    major: "Ausfall",
    operational: "Funktionsfähig",
    partial: "Teilweiser Ausfall",
    title: "Dienst-Statussymbole",
  },
});

function expectFetchMockCalls(urls: string[]) {
  expect(fetchMock.mock.calls.length).toEqual(urls.length);
  for (let i = 0; i < urls.length; i++) {
    expect(fetchMock.mock.calls[i][0]).toEqual(urls[i]);
  }
}

const LANGAUGE = "de";

// Reroute Tauri's `fetch` to `fetch-mock` library:
vi.unmock("@tauri-apps/plugin-http");
vi.mock("@tauri-apps/plugin-http", () => ({
  fetch: global.fetch,
}));

beforeEach(() => {
  fetchMock.resetMocks();
});

describe("Server Status API", () => {
  it("should fetch the status successfully.", async () => {
    // Mock `fetch` responses:
    fetchMock.once(bethesdaStatusResponse).once(locizeGermanResponse);

    const { status, message } = await fetchLocalizedServerStatus(LANGAUGE);

    // Check if the return value is as expected:
    expect(status).toBe(Status.Operational);
    expect(message).toBe("Funktionsfähig");

    // Check if requests were made with the expected URLs:
    expectFetchMockCalls([
      "https://status.bethesda.net/en/status/api/statuses",
      "https://api.locize.app/657e9e0e-8225-4266-88dd-75f047f1a2b3/live/de/status",
    ]);
  });

  it("should throw exception when fetch fails.", async () => {
    // Mock `fetch` rejections:
    fetchMock.mockReject();

    // Not working:
    // await expect(
    //   () => fetchLocalizedServerStatus(LANGAUGE)
    // ).rejects.toThrow();

    // Workaround:
    let errorHappened = false;
    try {
      await fetchLocalizedServerStatus(LANGAUGE);
    } catch {
      errorHappened = true;
    }
    expect(errorHappened).toBe(true);

    // Check if requests were made with the expected URLs:
    expectFetchMockCalls([
      "https://status.bethesda.net/en/status/api/statuses",
    ]);
  });

  it("should ignore rejected locize response.", async () => {
    // Mock `fetch` responses:
    fetchMock.once(bethesdaStatusResponse).mockRejectOnce();

    const { status, message } = await fetchLocalizedServerStatus(LANGAUGE);

    // Check if the return value is as expected:
    expect(status).toBe(Status.Operational);
    expect(message).toBe("operational");

    // Check if requests were made with the expected URLs:
    expectFetchMockCalls([
      "https://status.bethesda.net/en/status/api/statuses",
      "https://api.locize.app/657e9e0e-8225-4266-88dd-75f047f1a2b3/live/de/status",
    ]);
  });

  it("should attempt to get the 'en' localization as fallback if locize returns empty response for some language.", async () => {
    // Mock `fetch` responses:
    fetchMock
      .once(bethesdaStatusResponse)
      .once("{}") // Response from "https://api.locize.app/657e9e0e-8225-4266-88dd-75f047f1a2b3/live/thisLanguageDoesntExist/status"
      .once(locizeEnglishResponse);

    const { status, message } = await fetchLocalizedServerStatus(LANGAUGE);

    // Check if the return value is as expected:
    expect(status).toBe(Status.Operational);
    expect(message).toBe("Operational");

    // Check if requests were made with the expected URLs:
    expectFetchMockCalls([
      "https://status.bethesda.net/en/status/api/statuses",
      "https://api.locize.app/657e9e0e-8225-4266-88dd-75f047f1a2b3/live/de/status",
      "https://api.locize.app/657e9e0e-8225-4266-88dd-75f047f1a2b3/live/en/status",
    ]);
  });
});
