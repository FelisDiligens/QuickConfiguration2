import { subscribeWithSelector } from "@/utils/zustand";
import deepEqual from "fast-deep-equal/es6";
import _ from "lodash";
import { vi } from "vitest";
import { create } from "zustand";

// Adapted from https://github.com/pmndrs/zustand/blob/main/tests/subscribe.test.tsx
describe("subscribe()", () => {
  it("should not be called when state slice is the same", () => {
    const spy = vi.fn();
    const initialState = { value: 1, other: "a" };
    const useBoundStore = create(() => initialState);

    subscribeWithSelector(useBoundStore, (s) => s.value, spy);
    useBoundStore.setState({ other: "b" });
    expect(spy).not.toHaveBeenCalled();
  });

  it("should be called when state slice changes", () => {
    const spy = vi.fn();
    const initialState = { value: 1, other: "a" };
    const useBoundStore = create(() => initialState);

    subscribeWithSelector(useBoundStore, (s) => s.value, spy);
    useBoundStore.setState({ value: initialState.value + 1 });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      initialState.value + 1,
      initialState.value,
    );
  });

  it("should be called when state slice changes twice", () => {
    const spy = vi.fn();
    const initialState = { value: 1, other: "a" };
    const useBoundStore = create(() => initialState);

    subscribeWithSelector(useBoundStore, (s) => s.value, spy);
    useBoundStore.setState({ value: initialState.value + 1 });
    useBoundStore.setState({ value: initialState.value });
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith(
      initialState.value + 1,
      initialState.value,
    );
    expect(spy).toHaveBeenCalledWith(
      initialState.value,
      initialState.value + 1,
    );
  });

  it("should be called when state slice changes (and the original reference is changed too)", () => {
    const spyCallback = vi.fn();
    const spyEquals = vi.fn().mockImplementationOnce(deepEqual);
    const initialState = { value: ["a", "b"] };
    const useBoundStore = create(() => initialState);

    subscribeWithSelector(useBoundStore, (s) => s.value, spyCallback, {
      equalityFn: spyEquals,
    });
    useBoundStore.setState({ value: _(initialState.value).push("c").value() });
    expect(spyEquals).toHaveBeenCalledTimes(1);
    expect(spyEquals).toHaveBeenCalledWith(["a", "b"], ["a", "b", "c"]);
    expect(spyCallback).toHaveBeenCalledTimes(1);
    expect(spyCallback).toHaveBeenCalledWith(["a", "b", "c"], ["a", "b"]);
  });

  it("should not be called when state slice is the same, using get() to retrieve state", () => {
    const spy = vi.fn();
    const initialState = { value: 1, other: "a", getValue: () => 1 };
    const useBoundStore = create<typeof initialState>()((_set, get) => ({
      ...initialState,
      getValue: () => get().value,
    }));

    subscribeWithSelector(useBoundStore, (s) => s.value, spy);
    useBoundStore.setState({ other: "b" });
    expect(spy).not.toHaveBeenCalled();
  });

  it("should be called when state slice changes, using get() to retrieve state", () => {
    const spy = vi.fn();
    const initialState = { value: 1, other: "a", getValue: () => 1 };
    const useBoundStore = create<typeof initialState>()((_set, get) => ({
      ...initialState,
      getValue: () => get().value,
    }));

    subscribeWithSelector(useBoundStore, (s) => s.getValue(), spy);
    useBoundStore.setState({ value: initialState.value + 1 });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      initialState.value + 1,
      initialState.value,
    );
  });

  it("should not be called when equality checker returns true", () => {
    const spy = vi.fn();
    const initialState = { value: 1, other: "a" };
    const useBoundStore = create(() => initialState);

    subscribeWithSelector(useBoundStore, (s) => s.value, spy, {
      equalityFn: () => true,
    });
    useBoundStore.setState({ value: initialState.value + 2 });
    expect(spy).not.toHaveBeenCalled();
  });

  it("should be called when equality checker returns false", () => {
    const spy = vi.fn();
    const initialState = { value: 1, other: "a" };
    const useBoundStore = create(() => initialState);

    subscribeWithSelector(useBoundStore, (s) => s.value, spy, {
      equalityFn: () => false,
    });
    useBoundStore.setState({ value: initialState.value + 2 });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      initialState.value + 2,
      initialState.value,
    );
  });

  it("should unsubscribe correctly", () => {
    const spy = vi.fn();
    const initialState = { value: 1, other: "a" };
    const useBoundStore = create(() => initialState);

    const unsub = subscribeWithSelector(useBoundStore, (s) => s.value, spy);

    useBoundStore.setState({ value: initialState.value + 1 });
    unsub();
    useBoundStore.setState({ value: initialState.value + 2 });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      initialState.value + 1,
      initialState.value,
    );
  });

  it("should call listener immediately when fireImmediately is true", () => {
    const spy = vi.fn();
    const initialState = { value: 1 };
    const useBoundStore = create(() => initialState);

    subscribeWithSelector(useBoundStore, (s) => s.value, spy, {
      fireImmediately: true,
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(1, 1);
  });
});
