import { commands } from "@/commands/bindings";
import { modsStoreSync, updateModsStore, useModsStore } from "@/stores/mods";
import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { vi } from "vitest";

vi.unmock("@/stores/profiles");
vi.mock("@/stores/profiles", () => ({
  useProfilesStore: {
    getState: vi.fn().mockReturnValue({
      getModsPath: vi.fn().mockReturnValue("Mods path"),
    }),
    subscribe: vi.fn(),
  },
}));

vi.unmock("@/commands/bindings");
vi.mock(import("@/commands/bindings"), async (importOriginal) => {
  const originalModule = await importOriginal();
  return {
    ...originalModule,
    commands: {
      ...originalModule.commands,
      modsLoadMetadataOrDefault: vi.fn(),
      modsSaveMetadata: vi.fn(),
    },
  };
});

vi.unmock("@tauri-apps/api/webviewWindow");
vi.mock(import("@tauri-apps/api/webviewWindow"), async (importOriginal) => {
  const originalModule = await importOriginal();
  return {
    ...originalModule,
    getCurrentWebviewWindow: vi.fn().mockReturnValue({
      listen: vi.fn().mockResolvedValue(vi.fn()),
      onCloseRequested: vi.fn().mockResolvedValue(vi.fn()),
    }),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("<ModsStoreProvider> component and useModsStoreStatus/useModsStore hook", () => {
  it("should load data into store and make it accessable", async () => {
    vi.mocked(commands.modsLoadMetadataOrDefault).mockResolvedValueOnce({
      enabled: true,
      mods: [
        {
          key: "Mod key",
          title: "Mod title",
          folderName: "modfolder",
          version: "1.0",
          url: "",
          notes: "",
          enabled: false,
          options: {
            rootFolder: "",
          },
        },
      ],
      state: [],
    });

    // Mount store:
    const hook = renderHook(() => useModsStore((store) => store.mods));

    // Load mods:
    modsStoreSync.load().catch(console.error);

    // Access state:
    await waitFor(() => {
      const mods = hook.result.current;
      expect(mods).toHaveLength(1);
      expect(mods?.at(0)?.title).toEqual("Mod title");
    });

    // Check if function was called once:
    expect(commands.modsLoadMetadataOrDefault).toHaveBeenCalledTimes(1);
  });

  it("should save data from the store", async () => {
    vi.mocked(commands.modsLoadMetadataOrDefault).mockResolvedValueOnce({
      enabled: true,
      mods: [],
      state: [],
    });
    vi.mocked(commands.modsSaveMetadata).mockResolvedValueOnce(null);

    // Mount store:
    const hook = renderHook(() =>
      useModsStore((store) => store.disableModsGlobally),
    );

    // Load mods:
    modsStoreSync.load().catch(console.error);

    // Check if mods were loaded:
    await waitFor(() => {
      expect(commands.modsLoadMetadataOrDefault).toHaveBeenCalledTimes(1);
    });

    // Mutate state:
    act(() => {
      const disableModsGlobally = hook.result.current;
      disableModsGlobally();
    });

    // Flush debounced save so the test runs quicker:
    modsStoreSync.flushSave().catch(console.error);

    // Check if mods were saved:
    await waitFor(() => {
      expect(commands.modsSaveMetadata).toHaveBeenCalledWith("Mods path", {
        enabled: false,
        mods: [],
        state: [],
      });
    });
  });

  it("should update store", async () => {
    vi.mocked(commands.modsLoadMetadataOrDefault).mockResolvedValueOnce({
      enabled: true,
      mods: [],
      state: [],
    });

    // Mount store:
    const hook = renderHook(() => useModsStore((store) => store.enabled));

    // Load mods:
    modsStoreSync.load().catch(console.error);

    // Access state:
    await waitFor(() => {
      const enabled = hook.result.current;
      expect(enabled).toBe(true);
    });

    // Update store:
    act(() => {
      updateModsStore({ type: "updated-enabled", message: false });
    });

    // Access state:
    await waitFor(() => {
      const enabled = hook.result.current;
      expect(enabled).toBe(false);
    });

    // Check if function was called once:
    expect(commands.modsLoadMetadataOrDefault).toHaveBeenCalledTimes(1);
  });
});
