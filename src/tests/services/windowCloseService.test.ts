import type { WindowCloseSubscriber } from "@/services/windowCloseService";
import { beforeEach, describe, expect, it, vi } from "vitest";

type CloseHandler = (event: unknown) => Promise<void>;
type Callback = WindowCloseSubscriber["callback"];

function sync(fn: () => void): Callback {
  return () => {
    fn();
    return undefined;
  };
}

const mocks = vi.hoisted(() => ({
  label: "main",
  closeHandler: undefined as CloseHandler | undefined,
  onCloseRequested: vi.fn<(handler: CloseHandler) => Promise<void>>(),
}));

vi.mock("@tauri-apps/api/webviewWindow", () => ({
  getCurrentWebviewWindow: () => ({
    label: mocks.label,
    onCloseRequested: (handler: CloseHandler) =>
      mocks.onCloseRequested(handler),
  }),
}));

vi.mock("@/commands/errors", () => ({
  commandErrorToString: (error: unknown) => String(error),
}));

async function importService() {
  vi.resetModules();
  return await import("@/services/windowCloseService");
}

async function emitClose() {
  if (!mocks.closeHandler) throw new Error("No close handler registered");
  await mocks.closeHandler({});
}

beforeEach(() => {
  mocks.label = "main";
  mocks.closeHandler = undefined;
  mocks.onCloseRequested.mockReset();
  mocks.onCloseRequested.mockImplementation((handler) => {
    mocks.closeHandler = handler;
    return Promise.resolve();
  });
});

describe("WindowCloseService", () => {
  it("registers a close handler on the main window", async () => {
    await importService();
    expect(mocks.onCloseRequested).toHaveBeenCalledTimes(1);
    expect(mocks.closeHandler).toBeDefined();
  });

  it("does not register a close handler on other windows", async () => {
    mocks.label = "dndWindow";
    await importService();
    expect(mocks.onCloseRequested).not.toHaveBeenCalled();
  });

  it("invokes subscribers in descending priority order", async () => {
    const { windowCloseService } = await importService();
    const calls: string[] = [];
    windowCloseService.subscribe(
      sync(() => {
        calls.push("low");
      }),
      -1,
    );
    windowCloseService.subscribe(
      sync(() => {
        calls.push("high");
      }),
      10,
    );
    windowCloseService.subscribe(
      sync(() => {
        calls.push("default");
      }),
    );
    windowCloseService.subscribe(
      sync(() => {
        calls.push("mid");
      }),
      5,
    );

    await emitClose();
    expect(calls).toEqual(["high", "mid", "default", "low"]);
  });

  it("keeps the subscription order for equal priorities", async () => {
    const { windowCloseService } = await importService();
    const calls: string[] = [];
    windowCloseService.subscribe(
      sync(() => {
        calls.push("a");
      }),
      3,
    );
    windowCloseService.subscribe(
      sync(() => {
        calls.push("b");
      }),
      3,
    );
    windowCloseService.subscribe(
      sync(() => {
        calls.push("c");
      }),
    );

    await emitClose();
    expect(calls).toEqual(["a", "b", "c"]);
  });

  it("waits for async subscribers before the close handler resolves", async () => {
    const { windowCloseService } = await importService();
    let resolveSubscriber!: () => void;
    const subscriberDone = new Promise<void>((resolve) => {
      resolveSubscriber = resolve;
    });
    const onSubscriberDone: Callback = () => subscriberDone;
    windowCloseService.subscribe(onSubscriberDone);

    let closeSettled = false;
    const closePromise = emitClose().then(() => {
      closeSettled = true;
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(closeSettled).toBe(false);

    resolveSubscriber();
    await closePromise;
    expect(closeSettled).toBe(true);
  });

  it("invokes all subscribers even if one rejects, and logs the error", async () => {
    const { windowCloseService } = await importService();
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const reason = new Error("boom");
    const calls: string[] = [];
    const rejecting: Callback = async () => {
      calls.push("first");
      throw reason;
    };
    windowCloseService.subscribe(rejecting, 10);
    windowCloseService.subscribe(
      sync(() => {
        calls.push("second");
      }),
    );

    await emitClose();
    expect(calls).toEqual(["first", "second"]);
    expect(consoleError).toHaveBeenCalledWith(reason);
    consoleError.mockRestore();
  });

  it("stops invoking a subscriber after unsubscribing", async () => {
    const { windowCloseService } = await importService();
    const callback = vi.fn((): undefined => undefined);
    const unsubscribe = windowCloseService.subscribe(callback);

    unsubscribe();
    await emitClose();
    expect(callback).not.toHaveBeenCalled();
  });

  it("lets a higher priority synchronous subscriber be observed by lower priority ones", async () => {
    const { windowCloseService } = await importService();
    const store = { value: 0 };
    let savedValue = -1;
    windowCloseService.subscribe(
      sync(() => {
        store.value = 42;
      }),
      10,
    );
    windowCloseService.subscribe(
      sync(() => {
        savedValue = store.value;
      }),
    );

    await emitClose();
    expect(savedValue).toBe(42);
  });
});
