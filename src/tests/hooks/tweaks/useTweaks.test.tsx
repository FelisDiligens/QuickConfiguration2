import { commands } from "@/commands/bindings";
import ini from "@/commands/ini";
import useShadowBlurriness from "@/hooks/tweaks/graphics/shadows/useShadowBlurriness";
import useShadowQualityPreset, {
  ShadowQuality,
} from "@/hooks/tweaks/graphics/shadows/useShadowQualityPreset";
import useTweak, { errorAtom } from "@/hooks/tweaks/useTweak";
import { useProfilesStore } from "@/stores/profiles";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { getDefaultStore } from "jotai";
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

// Captures the listener that useTweak subscribes via windowCloseService at
// module level, so tests can simulate the window being closed.
const windowCloseState = vi.hoisted(() => ({
  listeners: [] as (() => Promise<void> | Promise<null>)[],
}));

vi.mock("@/services/windowCloseService", () => ({
  windowCloseService: {
    subscribe: (listener: () => Promise<void> | Promise<null>) => {
      windowCloseState.listeners.push(listener);
      return () => {
        const index = windowCloseState.listeners.indexOf(listener);
        if (index >= 0) windowCloseState.listeners.splice(index, 1);
      };
    },
  },
}));

const FIRST_PROFILE_KEY = "09E10E8D-D9DE-4BE4-93B8-1C59BC9C6E72";
const SECOND_PROFILE_KEY = "3F2504E0-4F89-41D3-9A0C-0305E82C3301";
const FIRST_INI_PATH =
  "C:\\\\Users\\\\steamuser\\\\Documents\\\\My Games\\\\Fallout 76";
const SECOND_INI_PATH = "D:\\\\Fallout76";

beforeEach(() => {
  useProfilesStore.getState().setStore({
    profiles: [
      {
        key: FIRST_PROFILE_KEY,
        title: "",
        installationPath: "",
        modsPath: "",
        executableName: "",
        execParameters: "",
        launcherURL: "",
        iniPrefix: "Fallout76",
        iniPath: FIRST_INI_PATH,
        gameEdition: "Unknown",
        launchOption: "OpenURL",
      },
      {
        key: SECOND_PROFILE_KEY,
        title: "Second profile",
        installationPath: "",
        modsPath: "",
        executableName: "",
        execParameters: "",
        launcherURL: "",
        iniPrefix: "Fallout76",
        iniPath: SECOND_INI_PATH,
        gameEdition: "Unknown",
        launchOption: "OpenURL",
      },
    ],
    selected: FIRST_PROFILE_KEY,
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  getDefaultStore().set(errorAtom, undefined);
  vi.clearAllMocks();
});

describe("useTweak", () => {
  const iniKey = (file: string, section: string | null, key: string) =>
    `${file}|${section ?? ""}|${key}`;

  // Backs the mocked ini commands with an in-memory map, so a write done by
  // one tweak's setter is visible to another tweak's getter.
  const installIniBackend = (
    initialValues: Record<string, number | string | boolean>,
  ) => {
    const data = new Map<string, number | string | boolean>(
      Object.entries(initialValues),
    );
    vi.mocked(commands.iniGetInt).mockImplementation((file, section, key) => {
      const value = data.get(iniKey(file, section, key));
      return Promise.resolve(typeof value === "number" ? value : null);
    });
    vi.mocked(commands.iniSetInt).mockImplementation(
      (file, section, key, value) => {
        data.set(iniKey(file, section, key), value);
        return Promise.resolve();
      },
    );
    vi.mocked(commands.iniGetFloat).mockImplementation((file, section, key) => {
      const value = data.get(iniKey(file, section, key));
      return Promise.resolve(typeof value === "number" ? value : null);
    });
    vi.mocked(commands.iniSetFloat).mockImplementation(
      (file, section, key, value) => {
        data.set(iniKey(file, section, key), value);
        return Promise.resolve();
      },
    );
    vi.mocked(commands.iniGetString).mockImplementation(
      (file, section, key) => {
        const value = data.get(iniKey(file, section, key));
        return Promise.resolve(typeof value === "string" ? value : null);
      },
    );
    vi.mocked(commands.iniSetString).mockImplementation(
      (file, section, key, value) => {
        data.set(iniKey(file, section, key), value);
        return Promise.resolve();
      },
    );
    vi.mocked(commands.iniGetBoolean).mockImplementation(
      (file, section, key) => {
        const value = data.get(iniKey(file, section, key));
        return Promise.resolve(typeof value === "boolean" ? value : null);
      },
    );
    vi.mocked(commands.iniSetBoolean).mockImplementation(
      (file, section, key, value) => {
        data.set(iniKey(file, section, key), value);
        return Promise.resolve();
      },
    );
  };

  const intGetCallsFor = (key: string) =>
    vi.mocked(commands.iniGetInt).mock.calls.filter((call) => call[2] === key)
      .length;

  // Runs the setter and then waits two macrotask ticks. Each tick lets the
  // microtask queue drain, so the async wrappedSetter chain
  // (setValue -> setter -> setNeedsToSave -> setNeedsToReload) and the
  // React/jotai updates it triggers have fully settled before asserting.
  const setAndSettle = async (run: () => void) => {
    await act(async () => {
      run();
      await new Promise((resolve) => setTimeout(resolve, 0));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  };

  // Advances the fake timers, e.g. to fire the 5s debounced ini save
  // without waiting for it in real time.
  const advanceTimers = async (ms: number) => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });
  };

  const flushAsync = async () => {
    await act(async () => {
      await Promise.resolve();
    });
  };

  const useSharedValue = (reloadNecessary = false) =>
    useTweak(
      async () => ini.getInt("Prefs", "MAIN", "iSharedValue"),
      async (val) => ini.setInt("Prefs", "MAIN", "iSharedValue", val),
      -1,
      reloadNecessary,
    );

  const ultraShadowIniValues = {
    "Prefs|Display|iShadowMapResolution": 2048,
    "Prefs|Display|uiShadowFilter": 3,
    "Prefs|Display|uiOrthoShadowFilter": 3,
    "Prefs|Display|fBlendSplitDirShadow": 48.0,
    "Prefs|Display|iMaxFocusShadows": 4,
  };

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

    await waitFor(() => {
      const [value] = hook.result.current;
      expect(value).toBe(5);
    });

    vi.useFakeTimers();
    await act(async () => {
      const [, setter] = hook.result.current;
      setter(10);
    });
    expect(mockedIniSetInt).toHaveBeenCalledTimes(1);
    expect(mockedIniSave).not.toHaveBeenCalled();

    await advanceTimers(4999);
    expect(mockedIniSave).not.toHaveBeenCalled();
    await advanceTimers(1);
    expect(mockedIniSave).toHaveBeenCalledTimes(1);
    expect(mockedIniSave).toHaveBeenCalledWith(
      FIRST_INI_PATH,
      "Fallout76",
      true,
    );
  });

  it("should fall back to the default value when the getter returns null", async () => {
    vi.mocked(commands.iniGetInt).mockResolvedValueOnce(null);

    const hook = renderHook(() =>
      useTweak(
        async () => ini.getInt("Prefs", "MAIN", "iValue"),
        async (val) => ini.setInt("Prefs", "MAIN", "iValue", val),
        42,
      ),
    );

    await waitFor(() => {
      const [value] = hook.result.current;
      expect(value).toBe(42);
    });
    expect(vi.mocked(commands.iniGetInt)).toHaveBeenCalledTimes(1);
  });

  describe("reloadNecessary in wrappedSetter", () => {
    it("should update other tweaks through their getter when a tweak with reloadNecessary: true changes a shared ini value", async () => {
      installIniBackend({ "Prefs|MAIN|iSharedValue": 1 });

      const hook = renderHook(() => ({
        first: useSharedValue(true),
        second: useSharedValue(),
      }));

      await waitFor(() => {
        const {
          first: [firstValue],
          second: [secondValue],
        } = hook.result.current;
        expect(firstValue).toBe(1);
        expect(secondValue).toBe(1);
      });
      const getCallsBefore = intGetCallsFor("iSharedValue");

      await setAndSettle(() => {
        const [, setFirstValue] = hook.result.current.first;
        setFirstValue(2);
      });

      await waitFor(() => {
        const {
          second: [secondValue],
        } = hook.result.current;
        expect(secondValue).toBe(2);
      });
      const {
        first: [firstValue],
      } = hook.result.current;
      expect(firstValue).toBe(2);
      expect(intGetCallsFor("iSharedValue")).toBeGreaterThan(getCallsBefore);
      expect(vi.mocked(commands.iniSetInt)).toHaveBeenCalledWith(
        "Prefs",
        "MAIN",
        "iSharedValue",
        2,
      );
    });

    it("should not reload other tweaks when reloadNecessary is false", async () => {
      installIniBackend({ "Prefs|MAIN|iSharedValue": 1 });

      const hook = renderHook(() => ({
        first: useSharedValue(false),
        second: useSharedValue(),
      }));

      await waitFor(() => {
        const {
          first: [firstValue],
          second: [secondValue],
        } = hook.result.current;
        expect(firstValue).toBe(1);
        expect(secondValue).toBe(1);
      });
      const getCallsBefore = intGetCallsFor("iSharedValue");

      await setAndSettle(() => {
        const [, setFirstValue] = hook.result.current.first;
        setFirstValue(2);
      });

      await waitFor(() => {
        const {
          first: [firstValue],
        } = hook.result.current;
        expect(firstValue).toBe(2);
      });
      const {
        second: [secondValue],
      } = hook.result.current;
      expect(secondValue).toBe(1);
      expect(intGetCallsFor("iSharedValue")).toBe(getCallsBefore);
    });

    it("should update the shadow blurriness through its getter when the shadow quality preset changes the same ini value", async () => {
      installIniBackend(ultraShadowIniValues);

      const hook = renderHook(() => ({
        preset: useShadowQualityPreset(),
        blurriness: useShadowBlurriness(),
      }));

      await waitFor(() => {
        const {
          preset: [preset],
          blurriness: [blurriness],
        } = hook.result.current;
        expect(preset).toBe(ShadowQuality.Ultra);
        expect(blurriness).toBe(3);
      });
      const getCallsBefore = intGetCallsFor("uiOrthoShadowFilter");

      await setAndSettle(() => {
        const [, setPreset] = hook.result.current.preset;
        setPreset(ShadowQuality.Low);
      });

      await waitFor(() => {
        const {
          blurriness: [blurriness],
        } = hook.result.current;
        expect(blurriness).toBe(0);
      });
      const {
        preset: [preset],
      } = hook.result.current;
      expect(preset).toBe(ShadowQuality.Low);
      expect(intGetCallsFor("uiOrthoShadowFilter")).toBeGreaterThan(
        getCallsBefore,
      );
      expect(vi.mocked(commands.iniSetInt)).toHaveBeenCalledWith(
        "Prefs",
        "Display",
        "uiOrthoShadowFilter",
        0,
      );
    });

    it("should reload related tweaks again on every subsequent preset change", async () => {
      installIniBackend(ultraShadowIniValues);

      const hook = renderHook(() => ({
        preset: useShadowQualityPreset(),
        blurriness: useShadowBlurriness(),
      }));

      await waitFor(() => {
        const {
          preset: [preset],
          blurriness: [blurriness],
        } = hook.result.current;
        expect(preset).toBe(ShadowQuality.Ultra);
        expect(blurriness).toBe(3);
      });

      await setAndSettle(() => {
        const [, setPreset] = hook.result.current.preset;
        setPreset(ShadowQuality.Low);
      });
      await waitFor(() => {
        const {
          blurriness: [blurriness],
        } = hook.result.current;
        expect(blurriness).toBe(0);
      });
      const getCallsAfterLow = intGetCallsFor("uiOrthoShadowFilter");

      await setAndSettle(() => {
        const [, setPreset] = hook.result.current.preset;
        setPreset(ShadowQuality.High);
      });
      await waitFor(() => {
        const {
          blurriness: [blurriness],
        } = hook.result.current;
        expect(blurriness).toBe(2);
      });
      const {
        preset: [preset],
      } = hook.result.current;
      expect(preset).toBe(ShadowQuality.High);
      expect(intGetCallsFor("uiOrthoShadowFilter")).toBeGreaterThan(
        getCallsAfterLow,
      );
    });
  });

  describe("debounced saving", () => {
    it("should save only once when the value is set multiple times in quick succession", async () => {
      installIniBackend({ "Prefs|MAIN|iSharedValue": 1 });
      const mockedIniSetInt = vi.mocked(commands.iniSetInt);
      const mockedIniSave = vi.mocked(commands.iniSave);

      const hook = renderHook(() => useSharedValue());
      await waitFor(() => {
        const [value] = hook.result.current;
        expect(value).toBe(1);
      });

      vi.useFakeTimers();
      await act(async () => {
        const [, setter] = hook.result.current;
        setter(2);
        setter(3);
        setter(4);
      });
      expect(mockedIniSetInt).toHaveBeenCalledTimes(3);
      const [value] = hook.result.current;
      expect(value).toBe(4);
      expect(mockedIniSave).not.toHaveBeenCalled();

      await advanceTimers(4999);
      expect(mockedIniSave).not.toHaveBeenCalled();
      await advanceTimers(1);
      expect(mockedIniSave).toHaveBeenCalledTimes(1);
    });

    it("should store the save error in errorAtom when saving fails", async () => {
      installIniBackend({ "Prefs|MAIN|iSharedValue": 1 });
      const saveError = new Error("disk full");
      const mockedIniSave = vi.mocked(commands.iniSave);

      const hook = renderHook(() => useSharedValue());
      await waitFor(() => {
        const [value] = hook.result.current;
        expect(value).toBe(1);
      });

      mockedIniSave.mockRejectedValueOnce(saveError);
      await act(async () => {
        const [, setter] = hook.result.current;
        setter(2);
      });
      expect(mockedIniSave).not.toHaveBeenCalled();

      // Flush the pending save via unmount: use-debounce only hands out the
      // save promise on flush(), so this path attaches a .catch in time and
      // the test doesn't end with an unhandled rejection.
      act(() => {
        hook.unmount();
      });
      await flushAsync();
      expect(mockedIniSave).toHaveBeenCalledTimes(1);
      expect(getDefaultStore().get(errorAtom)).toBe(saveError);
    });
  });

  describe("lifecycle", () => {
    it("should flush a pending save when the hook unmounts", async () => {
      installIniBackend({ "Prefs|MAIN|iSharedValue": 1 });
      const mockedIniSave = vi.mocked(commands.iniSave);

      const hook = renderHook(() => useSharedValue());
      await waitFor(() => {
        const [value] = hook.result.current;
        expect(value).toBe(1);
      });

      vi.useFakeTimers();
      await act(async () => {
        const [, setter] = hook.result.current;
        setter(2);
      });
      expect(mockedIniSave).not.toHaveBeenCalled();

      act(() => {
        hook.unmount();
      });
      await flushAsync();
      expect(mockedIniSave).toHaveBeenCalledTimes(1);
      expect(mockedIniSave).toHaveBeenCalledWith(
        FIRST_INI_PATH,
        "Fallout76",
        true,
      );
    });

    it("should not save on unmount when nothing was changed", async () => {
      installIniBackend({ "Prefs|MAIN|iSharedValue": 1 });
      const mockedIniSave = vi.mocked(commands.iniSave);

      const hook = renderHook(() => useSharedValue());
      await waitFor(() => {
        const [value] = hook.result.current;
        expect(value).toBe(1);
      });

      act(() => {
        hook.unmount();
      });
      await flushAsync();
      expect(mockedIniSave).not.toHaveBeenCalled();
    });

    it("should flush a pending save when the window is about to close", async () => {
      installIniBackend({ "Prefs|MAIN|iSharedValue": 1 });
      const mockedIniSave = vi.mocked(commands.iniSave);

      const hook = renderHook(() => useSharedValue());
      await waitFor(() => {
        const [value] = hook.result.current;
        expect(value).toBe(1);
      });
      expect(windowCloseState.listeners).toHaveLength(1);

      vi.useFakeTimers();
      await act(async () => {
        const [, setter] = hook.result.current;
        setter(2);
      });
      expect(mockedIniSave).not.toHaveBeenCalled();

      await act(async () => {
        await Promise.all(
          windowCloseState.listeners.map((listener) => listener()),
        );
      });
      expect(mockedIniSave).toHaveBeenCalledTimes(1);
    });

    it("should cancel the pending save and reload the value when the profile changes", async () => {
      installIniBackend({ "Prefs|MAIN|iSharedValue": 1 });
      const mockedIniSetInt = vi.mocked(commands.iniSetInt);
      const mockedIniSave = vi.mocked(commands.iniSave);

      const hook = renderHook(() => useSharedValue());
      await waitFor(() => {
        const [value] = hook.result.current;
        expect(value).toBe(1);
      });
      const getCallsBefore = intGetCallsFor("iSharedValue");

      vi.useFakeTimers();
      await act(async () => {
        const [, setter] = hook.result.current;
        setter(2);
      });
      expect(mockedIniSetInt).toHaveBeenCalledTimes(1);
      expect(mockedIniSave).not.toHaveBeenCalled();

      await act(async () => {
        useProfilesStore.getState().setStore({ selected: SECOND_PROFILE_KEY });
      });
      expect(intGetCallsFor("iSharedValue")).toBeGreaterThan(getCallsBefore);

      await advanceTimers(6000);
      expect(mockedIniSave).not.toHaveBeenCalled();

      await act(async () => {
        const [, setter] = hook.result.current;
        setter(3);
      });
      await advanceTimers(5000);
      expect(mockedIniSave).toHaveBeenCalledTimes(1);
      expect(mockedIniSave).toHaveBeenCalledWith(
        SECOND_INI_PATH,
        "Fallout76",
        true,
      );
    });
  });
});
