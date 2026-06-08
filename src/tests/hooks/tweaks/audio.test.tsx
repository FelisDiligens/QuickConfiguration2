import { commands } from "@/commands/bindings";
import useEnableAudio from "@/hooks/tweaks/audio/useEnableAudio";
import { act, renderHook, waitFor } from "@testing-library/react";
import { vi } from "vitest";

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

describe("useEnableAudio", () => {
  it("should work as expected", async () => {
    const mockedIniGetBoolean = vi.mocked(commands.iniGetBoolean);
    const mockedIniSetBoolean = vi.mocked(commands.iniSetBoolean);
    mockedIniGetBoolean.mockResolvedValue(false);

    const hook = renderHook(() => useEnableAudio());

    await waitFor(() => {
      const [value] = hook.result.current;
      expect(value).toBe(false);
      expect(mockedIniGetBoolean).toHaveBeenCalledTimes(1);
      expect(mockedIniSetBoolean).not.toHaveBeenCalledTimes(1);
    });

    act(() => {
      const [_, setter] = hook.result.current;
      setter(true);
    });

    await waitFor(() => {
      const [value] = hook.result.current;
      expect(value).toBe(true);
      expect(mockedIniSetBoolean).toHaveBeenCalledTimes(1);
      expect(mockedIniSetBoolean).toHaveBeenLastCalledWith(
        "Custom",
        "Audio",
        "bEnableAudio",
        true,
      );
    });
  });
});
