import type {
  ArchiveFileInfo,
  DeployedArchive,
  ManagedMod,
  ModInstallationState,
} from "@/commands/bindings";
import Mods from "@/commands/mods";
import { useModsStore } from "@/stores/mods";
import { useProfilesStore } from "@/stores/profiles";
import { useResourceListStore } from "@/stores/resourceList";
import { useMappedResources } from "@/views/mods/tabs/resourceList/useMappedResources";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/stores/resourceList", async () => {
  const { create } = await import("zustand");
  return {
    useResourceListStore: create<{
      resources: string[];
      setResources: (
        resources: string[] | ((prev: string[]) => string[]),
      ) => void;
    }>()((set, get) => ({
      resources: [],
      setResources: (resources) =>
        set({
          resources:
            typeof resources === "function"
              ? resources(get().resources)
              : resources,
        }),
    })),
  };
});

vi.mock("@/stores/mods", async () => {
  const { create } = await import("zustand");
  return {
    useModsStore: create<{
      mods: ManagedMod[];
      state: ModInstallationState[];
    }>()(() => ({ mods: [], state: [] })),
  };
});

vi.mock("@/stores/profiles", async () => {
  const { create } = await import("zustand");
  return {
    useProfilesStore: create<{
      dataPath: string | undefined;
      getGameDataPath: () => string | undefined;
    }>()((_set, get) => ({
      dataPath: "/game/Data",
      getGameDataPath: () => get().dataPath,
    })),
  };
});

vi.mock("@/commands/mods", () => ({
  default: {
    utils: {
      getDeployedArchives: vi.fn(),
      getArchiveFileInfos: vi.fn(),
    },
  },
}));

const getDeployedArchives = vi.mocked(Mods.utils.getDeployedArchives);
const getArchiveFileInfos = vi.mocked(Mods.utils.getArchiveFileInfos);

function createMod(key: string, title: string): ManagedMod {
  return {
    key,
    title,
    folderName: `folder-${key}`,
    version: "1.0",
    url: "",
    notes: "",
    enabled: true,
    options: { rootFolder: "" },
  };
}

function createState(key: string): ModInstallationState {
  return {
    key,
    rootFolder: "",
    files: [`Data\\mod-${key}.ba2`],
  };
}

function createFileInfo(name: string, exists: boolean, fileSize?: string) {
  return { name, exists, fileSize } as ArchiveFileInfo;
}

// The mocked profiles store is typed as the real one, so setting the mock-only
// `dataPath` field requires a cast:
function setDataPath(dataPath: string | undefined) {
  (
    useProfilesStore as unknown as {
      setState: (state: { dataPath: string | undefined }) => void;
    }
  ).setState({ dataPath });
}

function setStores({
  resources = [],
  mods = [],
  state = [],
}: {
  resources?: string[];
  mods?: ManagedMod[];
  state?: ModInstallationState[];
}) {
  useResourceListStore.setState({ resources });
  useModsStore.setState({ mods, state });
  setDataPath("/game/Data");
}

beforeEach(() => {
  vi.clearAllMocks();
  setStores({});
  getDeployedArchives.mockResolvedValue([]);
  getArchiveFileInfos.mockResolvedValue([]);
});

describe("useMappedResources", () => {
  it("maps resources to the title of the mod that deploys them, plus file metadata", async () => {
    const mod = createMod("mod-1", "My Mod");
    setStores({
      resources: ["mod-mod-1.ba2"],
      mods: [mod],
      state: [createState("mod-1")],
    });
    getDeployedArchives.mockResolvedValue([
      { modId: "mod-1", archiveName: "mod-mod-1.ba2" } as DeployedArchive,
    ]);
    getArchiveFileInfos.mockResolvedValue([
      createFileInfo("mod-mod-1.ba2", true, "1234"),
    ]);

    const { result } = renderHook(() => useMappedResources());

    await waitFor(() =>
      expect(result.current.mappedResources).toEqual([
        {
          name: "mod-mod-1.ba2",
          modName: "My Mod",
          fileSize: 1234,
          exists: true,
        },
      ]),
    );
    expect(getArchiveFileInfos).toHaveBeenCalledWith("/game/Data", [
      "mod-mod-1.ba2",
    ]);
  });

  it("shows -/- and exists=false for resources not deployed by any mod", async () => {
    setStores({ resources: ["a.ba2"] });
    getDeployedArchives.mockResolvedValue([]);
    getArchiveFileInfos.mockResolvedValue([createFileInfo("a.ba2", false)]);

    const { result } = renderHook(() => useMappedResources());

    await waitFor(() =>
      expect(result.current.mappedResources).toEqual([
        { name: "a.ba2", modName: "-/-", fileSize: 0, exists: false },
      ]),
    );
  });

  it("does not query file infos when no game data path is set", async () => {
    setStores({ resources: ["a.ba2"] });
    setDataPath(undefined);

    const { result } = renderHook(() => useMappedResources());

    await waitFor(() =>
      expect(result.current.mappedResources).toEqual([
        { name: "a.ba2", modName: "-/-", fileSize: 0, exists: false },
      ]),
    );
    expect(getArchiveFileInfos).not.toHaveBeenCalled();
  });

  it("re-maps when the mods store changes even if the resource names stay identical (import + deploy scenario)", async () => {
    setStores({ resources: ["mod-mod-1.ba2"], mods: [], state: [] });
    getDeployedArchives.mockResolvedValue([]);

    const { result } = renderHook(() => useMappedResources());
    await waitFor(() =>
      expect(result.current.mappedResources[0]?.modName).toBe("-/-"),
    );
    expect(getDeployedArchives).toHaveBeenCalledTimes(1);

    // Simulate importing and deploying the mod: the mods store changes and the
    // resource list is set again with a fresh array containing the same names:
    const mod = createMod("mod-1", "My Mod");
    getDeployedArchives.mockResolvedValue([
      { modId: "mod-1", archiveName: "mod-mod-1.ba2" } as DeployedArchive,
    ]);
    act(() => {
      useModsStore.setState({ mods: [mod], state: [createState("mod-1")] });
      useResourceListStore.setState({ resources: ["mod-mod-1.ba2"] });
    });

    await waitFor(() =>
      expect(result.current.mappedResources[0]?.modName).toBe("My Mod"),
    );
    expect(getDeployedArchives).toHaveBeenCalledTimes(2);
  });

  it("re-maps when a mod is renamed", async () => {
    const mod = createMod("mod-1", "My Mod");
    setStores({
      resources: ["mod-mod-1.ba2"],
      mods: [mod],
      state: [createState("mod-1")],
    });
    getDeployedArchives.mockResolvedValue([
      { modId: "mod-1", archiveName: "mod-mod-1.ba2" } as DeployedArchive,
    ]);

    const { result } = renderHook(() => useMappedResources());
    await waitFor(() =>
      expect(result.current.mappedResources[0]?.modName).toBe("My Mod"),
    );

    act(() => {
      useModsStore.setState({ mods: [{ ...mod, title: "Renamed Mod" }] });
    });

    await waitFor(() =>
      expect(result.current.mappedResources[0]?.modName).toBe("Renamed Mod"),
    );
  });

  it("does not re-map when only reordering via setMappedResources (drag and drop)", async () => {
    setStores({
      resources: ["a.ba2", "b.ba2"],
      mods: [createMod("mod-1", "My Mod")],
      state: [createState("mod-1")],
    });
    getDeployedArchives.mockResolvedValue([
      { modId: "mod-1", archiveName: "a.ba2" } as DeployedArchive,
      { modId: "mod-1", archiveName: "b.ba2" } as DeployedArchive,
    ]);

    const { result } = renderHook(() => useMappedResources());
    await waitFor(() =>
      expect(result.current.mappedResources.map((r) => r.name)).toEqual([
        "a.ba2",
        "b.ba2",
      ]),
    );
    expect(getDeployedArchives).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.setMappedResources((prev) => [...prev].reverse());
    });

    expect(result.current.mappedResources.map((r) => r.name)).toEqual([
      "b.ba2",
      "a.ba2",
    ]);
    expect(useResourceListStore.getState().resources).toEqual([
      "b.ba2",
      "a.ba2",
    ]);
    // Metadata is preserved and the expensive mapping is not repeated:
    expect(result.current.mappedResources[0]?.modName).toBe("My Mod");
    expect(getDeployedArchives).toHaveBeenCalledTimes(1);
  });

  it("falls back to unmapped resources when mapping fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    setStores({ resources: ["a.ba2"] });
    getDeployedArchives.mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useMappedResources());

    await waitFor(() =>
      expect(result.current.mappedResources).toEqual([
        { name: "a.ba2", modName: "", fileSize: 0, exists: false },
      ]),
    );
  });
});
