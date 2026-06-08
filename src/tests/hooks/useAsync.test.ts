import { useAsync } from "@/hooks/async";
import { act, renderHook, waitFor } from "@testing-library/react";
import { vi } from "vitest";

interface User {
  id: number;
  name: string;
}

interface MockPromiseOptions<T> {
  value: T;
  delay?: number;
  shouldReject?: boolean;
}

function createMockPromise<T>({
  value,
  delay,
  shouldReject,
}: MockPromiseOptions<T>) {
  return () => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (shouldReject) {
          reject(new Error("Mocked error"));
        } else {
          resolve(value);
        }
      }, delay || 100);
    });
  };
}

describe("useAsync", () => {
  it("should fetch data immediately and update state", async () => {
    const mockUser: User = { id: 1, name: "John Doe" };
    const mockPromiseFn = createMockPromise({ value: mockUser });

    const { result } = renderHook(() => useAsync({ promiseFn: mockPromiseFn }));

    expect(result.current.isPending).toBe(true);
    expect(result.current.status).toBe("pending");
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeUndefined();

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
      expect(result.current.status).toBe("success");
      expect(result.current.data).toEqual(mockUser);
      expect(result.current.error).toBeUndefined();
    });
  });

  it("should handle promise rejection", async () => {
    const mockError = new Error("Mocked error");
    const mockPromiseFn = createMockPromise<User>({
      value: { id: 1, name: "John Doe" },
      shouldReject: true,
    });

    const { result } = renderHook(() => useAsync({ promiseFn: mockPromiseFn }));

    expect(result.current.isPending).toBe(true);
    expect(result.current.status).toBe("pending");

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
      expect(result.current.status).toBe("error");
      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toEqual(mockError);
    });
  });

  it("should reload", async () => {
    let callCount = 0;
    const mockPromiseFn = () => {
      callCount++;
      return Promise.resolve({
        name: `Call ${callCount}`,
      });
    };

    const { result } = renderHook(() => useAsync({ promiseFn: mockPromiseFn }));

    expect(result.current.isPending).toBe(true);
    expect(result.current.status).toBe("pending");

    await waitFor(() => expect(result.current.data?.name).toEqual("Call 1"));
    expect(callCount).toBe(1);

    act(() => {
      result.current.reload();
    });

    expect(result.current.isPending).toBe(true);
    expect(result.current.status).toBe("pending");

    await waitFor(() => expect(result.current.data?.name).toEqual("Call 2"));
    expect(callCount).toBe(2);
  });

  it("should cancel pending promise and not update state", async () => {
    const mockUser: User = { id: 4, name: "Cancellable User" };
    const mockPromiseFn = createMockPromise({
      value: mockUser,
      delay: 1150,
      shouldReject: false,
    });

    const { result } = renderHook(() => useAsync({ promiseFn: mockPromiseFn }));

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    act(() => {
      result.current.cancel();
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
      expect(result.current.status).toBe("initial");
      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBeUndefined();
    });
  });

  it("should call onResolved after successful resolution", async () => {
    const mockUser: User = { id: 5, name: "Callback User" };
    const onResolvedMock = vi.fn();
    const onRejectedMock = vi.fn();
    const onSettledMock = vi.fn();
    const mockPromiseFn = createMockPromise({ value: mockUser });

    const { result } = renderHook(() =>
      useAsync({
        promiseFn: mockPromiseFn,
        onResolved: onResolvedMock,
        onRejected: onRejectedMock,
        onSettled: onSettledMock,
      }),
    );

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
      expect(onResolvedMock).toHaveBeenCalledTimes(1);
      expect(onResolvedMock).toHaveBeenCalledWith(mockUser);
      expect(onRejectedMock).not.toHaveBeenCalled();
      expect(onSettledMock).toHaveBeenCalledTimes(1);
    });
  });

  it("should call onRejected after promise rejection", async () => {
    const mockError = new Error("Mocked error");
    const onResolvedMock = vi.fn();
    const onRejectedMock = vi.fn();
    const onSettledMock = vi.fn();
    const mockPromiseFn = createMockPromise<User>({
      value: { id: 6, name: "Broken User" },

      shouldReject: true,
    });

    const { result } = renderHook(() =>
      useAsync({
        promiseFn: mockPromiseFn,
        onResolved: onResolvedMock,
        onRejected: onRejectedMock,
        onSettled: onSettledMock,
      }),
    );

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
      expect(onResolvedMock).not.toHaveBeenCalled();
      expect(onRejectedMock).toHaveBeenCalledTimes(1);
      expect(onRejectedMock).toHaveBeenCalledWith(mockError);
      expect(onSettledMock).toHaveBeenCalledTimes(1);
    });
  });

  it("should re-run when watch dependencies change", async () => {
    const mockUser: User = { id: 7, name: "Watched User" };
    let userId = 1;
    const mockPromiseFn = () =>
      Promise.resolve({
        ...mockUser,
        id: userId,
        name: `Watched User ${userId}`,
      });

    const { result, rerender } = renderHook(
      (props) => useAsync({ promiseFn: mockPromiseFn, watch: [props.userId] }),
      { initialProps: { userId } },
    );

    // Initial fetch with userId = 1
    await waitFor(() =>
      expect(result.current.data).toEqual({ id: 1, name: "Watched User 1" }),
    );

    // Change dependency, should trigger re-run
    userId = 2;
    rerender({ userId });

    await waitFor(() =>
      expect(result.current.data).toEqual({ id: 2, name: "Watched User 2" }),
    );

    // No change in dependency, should not re-run
    const oldData = result.current.data;
    rerender({ userId: 2 });
    await new Promise((resolve) => setTimeout(resolve, 100)); // Give time for potential re-run
    expect(result.current.data).toEqual(oldData); // Data should be the same
  });

  it("should allow manually setting data and error", async () => {
    const { result } = renderHook(() =>
      useAsync({
        promiseFn: () => Promise.resolve("Initial"),
      }),
    );

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
      expect(result.current.data).toBe("Initial");
      expect(result.current.error).toBeUndefined();
    });

    act(() => {
      result.current.setData("Manual Data");
    });
    await waitFor(() => {
      expect(result.current.data).toBe("Manual Data");
      expect(result.current.error).toBeUndefined();
    });

    act(() => {
      result.current.setError("Manual Error");
    });
    await waitFor(() => {
      expect(result.current.data).toBe("Manual Data"); // Data remains until new data arrives
      expect(result.current.error).toBe("Manual Error");
    });
  });

  it("should cancel on unmount (implied by watch cleanup)", async () => {
    const onCancelledMock = vi.fn();
    const mockPromiseFn = createMockPromise({
      value: { id: 1, name: "Cleanup User" },
      delay: 1000,
      shouldReject: false,
    });

    const { unmount, result } = renderHook(() =>
      useAsync({
        promiseFn: mockPromiseFn,
        onCancelled: onCancelledMock,
      }),
    );

    await waitFor(() => {
      expect(onCancelledMock).not.toHaveBeenCalled();
      expect(result.current.isPending).toBe(true);
    });

    // Unmount the component
    act(() => {
      unmount();
    });

    // Expect onCancelled to be called due to useEffect cleanup
    await waitFor(() => expect(onCancelledMock).toHaveBeenCalledTimes(1));
  });

  it("should not invoke promiseFn when enabled is false", async () => {
    const mockUser: User = { id: 8, name: "John Doe" };
    const mockPromiseFn = vi
      .fn()
      .mockImplementation(createMockPromise({ value: mockUser }));

    const { result } = renderHook(() =>
      useAsync({ promiseFn: mockPromiseFn, enabled: false }),
    );

    expect(result.current.isPending).toBe(false);
    expect(result.current.status).toBe("initial");
    expect(result.current.data).toBeUndefined();
    expect(mockPromiseFn).not.toHaveBeenCalled();

    // Wait a bit to ensure promiseFn is not called later
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(mockPromiseFn).not.toHaveBeenCalled();
  });

  it("should invoke promiseFn when enabled changes from false to true", async () => {
    const mockUser: User = { id: 9, name: "John Doe" };
    const mockPromiseFn = vi
      .fn()
      .mockImplementation(createMockPromise({ value: mockUser }));

    const { result, rerender } = renderHook(
      (props) => useAsync({ promiseFn: mockPromiseFn, enabled: props.enabled }),
      { initialProps: { enabled: false } },
    );

    expect(result.current.isPending).toBe(false);
    expect(result.current.status).toBe("initial");
    expect(mockPromiseFn).not.toHaveBeenCalled();

    // Change enabled to true
    rerender({ enabled: true });

    expect(result.current.isPending).toBe(true);
    expect(result.current.status).toBe("pending");
    expect(mockPromiseFn).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
      expect(result.current.status).toBe("success");
      expect(result.current.data).toEqual(mockUser);
    });
  });
});
