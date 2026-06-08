import { useLazyAsync } from "@/hooks/async";
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
  it("should handle promise rejection", async () => {
    const mockError = new Error("Mocked error");
    const mockPromiseFn = createMockPromise<User>({
      value: { id: 1, name: "John Doe" },
      shouldReject: true,
    });

    const { result } = renderHook(() =>
      useLazyAsync({ promiseFn: mockPromiseFn }),
    );

    act(() => {
      result.current.run();
    });

    expect(result.current.isPending).toBe(true);
    expect(result.current.status).toBe("pending");

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
      expect(result.current.status).toBe("error");
      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toEqual(mockError);
    });
  });

  it("should not fetch data immediately", async () => {
    const mockUser: User = { id: 2, name: "Jane Doe" };
    const mockPromiseFn = createMockPromise({ value: mockUser });

    const { result } = renderHook(() =>
      useLazyAsync({ promiseFn: mockPromiseFn }),
    );

    expect(result.current.isPending).toBe(false);
    expect(result.current.status).toBe("initial");
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeUndefined();

    act(() => {
      result.current.run();
    });

    expect(result.current.isPending).toBe(true);
    expect(result.current.status).toBe("pending");

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
      expect(result.current.status).toBe("success");
      expect(result.current.data).toEqual(mockUser);
    });
  });

  it("should run with new arguments", async () => {
    const mockUser1: User = { id: 1, name: "User 1" };
    const mockUser2: User = { id: 2, name: "User 2" };

    const mockPromiseFn = (currentUserId: number) => {
      return Promise.resolve(currentUserId === 1 ? mockUser1 : mockUser2);
    };

    const { result } = renderHook(() =>
      useLazyAsync<User, Error, number[]>({
        promiseFn: mockPromiseFn,
      }),
    );

    act(() => {
      result.current.run(1);
    });
    await waitFor(() => expect(result.current.data).toEqual(mockUser1));

    act(() => {
      result.current.run(2);
    });
    await waitFor(() => expect(result.current.data).toEqual(mockUser2));
  });

  it("should cancel pending promise and not update state", async () => {
    const mockUser: User = { id: 4, name: "Cancellable User" };
    const mockPromiseFn = createMockPromise({
      value: mockUser,
      delay: 1150,
      shouldReject: false,
    });

    const { result } = renderHook(() =>
      useLazyAsync({ promiseFn: mockPromiseFn }),
    );

    act(() => {
      result.current.run();
    });

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
      useLazyAsync({
        promiseFn: mockPromiseFn,
        onResolved: onResolvedMock,
        onRejected: onRejectedMock,
        onSettled: onSettledMock,
      }),
    );

    act(() => {
      result.current.run();
    });

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
      useLazyAsync({
        promiseFn: mockPromiseFn,
        onResolved: onResolvedMock,
        onRejected: onRejectedMock,
        onSettled: onSettledMock,
      }),
    );

    act(() => {
      result.current.run();
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
      expect(onResolvedMock).not.toHaveBeenCalled();
      expect(onRejectedMock).toHaveBeenCalledTimes(1);
      expect(onRejectedMock).toHaveBeenCalledWith(mockError);
      expect(onSettledMock).toHaveBeenCalledTimes(1);
    });
  });

  it("should allow manually setting data and error", async () => {
    const { result } = renderHook(() =>
      useLazyAsync({ promiseFn: () => Promise.resolve("Initial") }),
    );

    act(() => {
      result.current.run();
    });

    await waitFor(() => {
      expect(result.current.data).toBeUndefined();
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
});
