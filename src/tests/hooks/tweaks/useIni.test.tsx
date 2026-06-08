import { CommandError, commands } from "@/commands/bindings";
import useIni from "@/hooks/tweaks/useIni";
import { useProfilesStore } from "@/stores/profiles";
import { renderHook, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { StateStorage } from "zustand/middleware";

vi.unmock("@/utils/zustand");
vi.mock("@/utils/zustand", () => ({
  syncStore: vi.fn().mockReturnValue({ load: vi.fn().mockResolvedValue(null) }),
  createStorageEngineFactory: vi.fn<() => StateStorage>(() => ({
    getItem: vi.fn((_name: string) => "{ state: {}, version: 0 }"),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  })),
}));

vi.unmock("@/commands/bindings");
vi.mock("@/commands/bindings", () => ({
  commands: {
    iniLoad: vi.fn(() => Promise.resolve(null)),
    iniGetErrorContext: vi.fn(() => Promise.reject(null)),
  },
}));

beforeEach(() => {
  useProfilesStore.getState().setStore({
    profiles: [
      {
        key: "09E10E8D-D9DE-4BE4-93B8-1C59BC9C6E72",
        title: "",
        installationPath: "",
        modsPath: "",
        executableName: "",
        execParameters: "",
        launcherURL: "",
        iniPrefix: "Fallout76",
        iniPath: "C:\\Users\\steamuser\\Documents\\My Games\\Fallout 76",
        gameEdition: "Unknown",
        launchOption: "OpenURL",
      },
    ],
    selected: "09E10E8D-D9DE-4BE4-93B8-1C59BC9C6E72",
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("useIni", () => {
  it("ini should get loaded", async () => {
    const mockedIniLoad = vi.mocked(commands.iniLoad);

    const hook = renderHook(() => useIni());

    await waitFor(() => {
      const [isLoading, error] = hook.result.current;
      expect(isLoading).toBe(false);
      expect(error).toBeNullish();
      expect(mockedIniLoad).toHaveBeenCalledTimes(1);
    });
  });

  it("ini should get reloaded", async () => {
    const mockedIniLoad = vi.mocked(commands.iniLoad);

    const profile = useProfilesStore.getState().getSelectedProfile();
    expect(profile).toBeTruthy();
    if (!profile) return; // appease TypeScript & ESLint
    useProfilesStore.getState().updateProfile({
      ...profile,
      iniPrefix: (Math.random() * 10000).toString(),
    });

    const hook = renderHook(() => useIni());

    await waitFor(() => {
      const [isLoading, error] = hook.result.current;
      expect(isLoading).toBe(false);
      expect(error).toBeNullish();
      expect(mockedIniLoad).toHaveBeenCalledTimes(1);
    });

    useProfilesStore.getState().updateProfile({
      ...profile,
      iniPrefix: (Math.random() * 10000).toString(),
    });

    await waitFor(() => {
      const [isLoading, error] = hook.result.current;
      expect(isLoading).toBe(false);
      expect(error).toBeNullish();
      expect(mockedIniLoad).toHaveBeenCalledTimes(2);
    });
  });

  it("ini parse errors should trigger getting more contextual information", async () => {
    const mockedIniLoad = vi.mocked(commands.iniLoad);
    mockedIniLoad.mockRejectedValueOnce({
      type: "IniParseError",
      fileName: "...",
      line: 0,
      col: 0,
      msg: "...",
    } as CommandError);
    const mockedIniGetErrorContext = vi.mocked(commands.iniGetErrorContext);
    mockedIniGetErrorContext.mockResolvedValueOnce({
      fileName: "...",
      lines: [],
    });

    const hook = renderHook(() => useIni());

    await waitFor(() => {
      const [isLoading, error, context] = hook.result.current;
      expect(isLoading).toBe(false);
      expect(error).toBeTruthy();
      expect(context).toBeTruthy();
      expect(mockedIniLoad).toHaveBeenCalledTimes(1);
      expect(mockedIniGetErrorContext).toHaveBeenCalledTimes(1);
    });
  });

  it("should not fetch when iniPath or iniPrefix is missing", async () => {
    const mockedIniLoad = vi.mocked(commands.iniLoad);

    useProfilesStore.getState().setStore({
      profiles: [
        {
          key: "test",
          title: "",
          installationPath: "",
          modsPath: "",
          executableName: "",
          execParameters: "",
          launcherURL: "",
          iniPrefix: "",
          iniPath: "",
          gameEdition: "Unknown",
          launchOption: "OpenURL",
        },
      ],
      selected: "test",
    });

    renderHook(() => useIni());

    await waitFor(() => {
      expect(mockedIniLoad).not.toHaveBeenCalled();
    });
  });
});
