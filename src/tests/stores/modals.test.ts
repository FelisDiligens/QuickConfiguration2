import { ModalComponentProps, useModalStore } from "@/stores/modals";

function StubModal(_props: ModalComponentProps<string, string>) {
  return null;
}

function OtherStubModal(_props: ModalComponentProps<number, boolean>) {
  return null;
}

beforeEach(() => {
  useModalStore.setState({ stack: [] });
});

describe("useModalStore", () => {
  it("pushes opened modals onto the stack, with the last opened on top", () => {
    void useModalStore.getState().open(StubModal, "first");
    const firstId = useModalStore.getState().stack[0].id;
    void useModalStore.getState().open(OtherStubModal, 42);

    const { stack } = useModalStore.getState();
    expect(stack).toHaveLength(2);
    expect(stack[0].id).toBe(firstId);
    expect(stack[1].id).not.toBe(firstId);
  });

  it("resolves the open promise with the result passed to close and pops the top modal", async () => {
    const promise = useModalStore.getState().open(StubModal, "data");
    expect(useModalStore.getState().stack).toHaveLength(1);

    useModalStore.getState().close("done");

    await expect(promise).resolves.toBe("done");
    expect(useModalStore.getState().stack).toHaveLength(0);
  });

  it("resolves with undefined when closed without a result (cancel)", async () => {
    const promise = useModalStore.getState().open(StubModal, "data");
    useModalStore.getState().close();
    await expect(promise).resolves.toBeUndefined();
  });

  it("keeps the promise pending until the modal is closed", async () => {
    let settled = false;
    const promise = useModalStore.getState().open(StubModal, "data");
    void promise.then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);

    useModalStore.getState().close("x");
    await promise;
    expect(settled).toBe(true);
  });

  it("closeById retracts a specific queued modal without touching the others", async () => {
    const first = useModalStore.getState().open(StubModal, "first");
    const second = useModalStore.getState().open(StubModal, "second");
    const secondId = useModalStore.getState().stack[1].id;

    useModalStore.getState().closeById(secondId, "retracted");

    await expect(second).resolves.toBe("retracted");
    expect(useModalStore.getState().stack).toHaveLength(1);

    let firstSettled = false;
    void first.then(() => {
      firstSettled = true;
    });
    await Promise.resolve();
    expect(firstSettled).toBe(false);

    useModalStore.getState().close("top");
    await expect(first).resolves.toBe("top");
  });

  it("closeAll resolves all pending modals with undefined and empties the stack", async () => {
    const p1 = useModalStore.getState().open(StubModal, "a");
    const p2 = useModalStore.getState().open(StubModal, "b");

    useModalStore.getState().closeAll();

    await expect(p1).resolves.toBeUndefined();
    await expect(p2).resolves.toBeUndefined();
    expect(useModalStore.getState().stack).toHaveLength(0);
  });

  it("close on an empty stack is a no-op", () => {
    expect(() => useModalStore.getState().close("x")).not.toThrow();
    expect(useModalStore.getState().stack).toHaveLength(0);
  });

  it("closeById with an unknown id is a no-op", () => {
    void useModalStore.getState().open(StubModal, "a");
    useModalStore.getState().closeById("does-not-exist");
    expect(useModalStore.getState().stack).toHaveLength(1);
  });
});
