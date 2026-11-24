import {
  useDebouncedReactState,
  useDebouncedState,
} from "@/hooks/useDebouncedState";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

interface Mod {
  title: string;
  notes: string;
  version: string;
}

const initialMod: Mod = { title: "a", notes: "", version: "1" };

describe("useDebouncedState", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("updates the cached state immediately but debounces the external update", () => {
    const setter = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedState<string>("a", setter, 1000),
    );

    act(() => {
      result.current[1]("b");
    });
    expect(result.current[0]).toBe("b");
    expect(setter).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(setter).toHaveBeenCalledTimes(1);
    expect(setter).toHaveBeenCalledWith("b");
  });
});

describe("useDebouncedReactState", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function setup(wait = 1000, options?: { flushOnExit?: boolean }) {
    const setter = vi.fn();
    const hook = renderHook(
      ({ state }) => useDebouncedReactState(state, setter, wait, options),
      { initialProps: { state: initialMod } },
    );
    return { setter, ...hook };
  }

  it("applies all functional updates made within the debounce window", () => {
    const { result, setter } = setup();

    act(() => {
      result.current[1]((mod) => ({ ...mod, title: "b" }));
      result.current[1]((mod) => ({ ...mod, notes: "n" }));
    });
    expect(result.current[0]).toEqual({
      ...initialMod,
      title: "b",
      notes: "n",
    });
    expect(setter).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(setter).toHaveBeenCalledTimes(1);
    const update = setter.mock.calls[0][0] as (prev: Mod) => Mod;
    expect(update(initialMod)).toEqual({
      ...initialMod,
      title: "b",
      notes: "n",
    });
  });

  it("replaces pending updates when called with a plain value", () => {
    const { result, setter } = setup();
    const replacement: Mod = { title: "x", notes: "y", version: "3" };

    act(() => {
      result.current[1]((mod) => ({ ...mod, title: "b" }));
    });
    act(() => {
      result.current[1](replacement);
    });
    expect(result.current[0]).toEqual(replacement);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(setter).toHaveBeenCalledTimes(1);
    const update = setter.mock.calls[0][0] as (prev: Mod) => Mod;
    expect(update(initialMod)).toEqual(replacement);
  });

  it("applies pending updates against the current external state", () => {
    const { result, setter } = setup();
    const external: Mod = { ...initialMod, version: "2" };

    act(() => {
      result.current[1]((mod) => ({ ...mod, title: "b" }));
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const update = setter.mock.calls[0][0] as (prev: Mod) => Mod;
    expect(update(external)).toEqual({ ...external, title: "b" });
  });

  it("flush applies pending updates immediately", () => {
    const { result, setter } = setup();

    act(() => {
      result.current[1]((mod) => ({ ...mod, title: "b" }));
    });
    act(() => result.current[1].flush());

    expect(setter).toHaveBeenCalledTimes(1);
    expect(result.current[1].isPending()).toBe(false);
  });

  it("flushes pending updates on unmount when flushOnExit is set", () => {
    const { result, setter, unmount } = setup(1000, { flushOnExit: true });

    act(() => {
      result.current[1]((mod) => ({ ...mod, title: "b" }));
    });
    expect(setter).not.toHaveBeenCalled();

    unmount();
    expect(setter).toHaveBeenCalledTimes(1);
  });

  it("returns a stable setter across rerenders", () => {
    const { result, rerender } = setup();
    const first = result.current[1];

    rerender({ state: { ...initialMod } });
    rerender({ state: { ...initialMod, title: "x" } });

    expect(result.current[1]).toBe(first);
  });

  it("syncs external state changes into the cache", () => {
    const { result, rerender } = setup();
    const external: Mod = { ...initialMod, title: "external" };

    rerender({ state: external });
    expect(result.current[0]).toEqual(external);
  });

  it("does not reset the cache from external changes while an update is pending", () => {
    const { result, rerender } = setup();

    act(() => {
      result.current[1]((mod) => ({ ...mod, title: "b" }));
    });
    rerender({ state: { ...initialMod, version: "2" } });

    expect(result.current[0]).toEqual({ ...initialMod, title: "b" });

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    rerender({ state: { ...initialMod, title: "b", version: "2" } });
    expect(result.current[0]).toEqual({
      ...initialMod,
      title: "b",
      version: "2",
    });
  });
});
