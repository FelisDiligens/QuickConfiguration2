import { commands } from "@/commands/bindings";
import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";
import { useProfilesStore } from "@/stores/profiles";
import { act, renderHook, waitFor } from "@testing-library/react";
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
    iniSave: vi.fn(() => Promise.resolve(null)),
    iniLoad: vi.fn(() => Promise.resolve(null)),
    iniGetString: vi.fn(),
    iniSetString: vi.fn((_value: string) => Promise.resolve()),
    iniGetInt: vi.fn(),
    iniSetInt: vi.fn((_value: number) => Promise.resolve()),
    iniGetFloat: vi.fn(),
    iniSetFloat: vi.fn((_value: number) => Promise.resolve()),
    iniGetBoolean: vi.fn(),
    iniSetBoolean: vi.fn((_value: boolean) => Promise.resolve()),
  },
}));

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

describe("useTweak", () => {
  it("should get and set from ini", async () => {
    const mockedIniGetInt = vi.mocked(commands.iniGetInt);
    const mockedIniSetInt = vi.mocked(commands.iniSetInt);
    mockedIniGetInt.mockResolvedValueOnce(5);

    const hook = renderHook(() =>
      useTweak(
        async () => ini.getInt("Prefs", "MAIN", "iValue"),
        async (val) => ini.setInt("Prefs", "MAIN", "iValue", val),
        0,
      ),
    );

    await waitFor(() => {
      const [value] = hook.result.current;
      expect(value).toBe(5);
      expect(mockedIniGetInt).toHaveBeenCalledTimes(1);
      expect(mockedIniSetInt).not.toHaveBeenCalledTimes(1);
    });

    act(() => {
      const [_, setter] = hook.result.current;
      setter(10);
    });

    await waitFor(() => {
      const [value] = hook.result.current;
      expect(value).toBe(10);
      expect(mockedIniSetInt).toHaveBeenCalledTimes(1);
      expect(mockedIniSetInt).toHaveBeenLastCalledWith(
        "Prefs",
        "MAIN",
        "iValue",
        10,
      );
    });
  });

  it("ini should save debounced", async () => {
    const mockedIniGetInt = vi.mocked(commands.iniGetInt);
    const mockedIniSetInt = vi.mocked(commands.iniSetInt);
    const mockedIniSave = vi.mocked(commands.iniSave);
    mockedIniGetInt.mockResolvedValueOnce(5);

    const hook = renderHook(() =>
      useTweak(
        async () => ini.getInt("Prefs", "MAIN", "iValue"),
        async (val) => ini.setInt("Prefs", "MAIN", "iValue", val),
        0,
      ),
    );

    act(() => {
      const [_, setter] = hook.result.current;
      setter(10);
    });

    await waitFor(
      () => {
        expect(mockedIniSetInt).toHaveBeenCalledTimes(1);
        expect(mockedIniSave).toHaveBeenCalledTimes(1);
      },
      { timeout: 6000 },
    );
  }, 6000);
});
