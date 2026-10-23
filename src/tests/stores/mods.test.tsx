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

  it("should move mods up and down in the store", async () => {
    const mods = ["Mod A", "Mod B", "Mod C"].map((title) => ({
      key: title,
      title,
      folderName: title,
      version: "1.0",
      url: "",
      notes: "",
      enabled: false,
      options: {
        rootFolder: "",
      },
    }));
    vi.mocked(commands.modsLoadMetadataOrDefault).mockResolvedValueOnce({
      enabled: true,
      mods,
      state: [],
    });

    // Mount store:
    const hook = renderHook(() => useModsStore((store) => store.mods));

    // Load mods:
    modsStoreSync.load().catch(console.error);

    // Check if mods were loaded:
    await waitFor(() => {
      expect(hook.result.current).toHaveLength(3);
    });

    const keys = () => hook.result.current.map((mod) => mod.key);

    // Move a mod up:
    act(() => {
      useModsStore.getState().moveModUp("Mod C");
    });
    expect(keys()).toEqual(["Mod A", "Mod C", "Mod B"]);

    // Moving the first mod up is a no-op:
    act(() => {
      useModsStore.getState().moveModUp("Mod A");
    });
    expect(keys()).toEqual(["Mod A", "Mod C", "Mod B"]);

    // Move a mod down:
    act(() => {
      useModsStore.getState().moveModDown("Mod A");
    });
    expect(keys()).toEqual(["Mod C", "Mod A", "Mod B"]);

    // Moving the last mod down is a no-op:
    act(() => {
      useModsStore.getState().moveModDown("Mod B");
    });
    expect(keys()).toEqual(["Mod C", "Mod A", "Mod B"]);

    // Moving an unknown mod is a no-op:
    act(() => {
      useModsStore.getState().moveModUp("Unknown");
    });
    expect(keys()).toEqual(["Mod C", "Mod A", "Mod B"]);
  });
});
