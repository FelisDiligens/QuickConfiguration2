import "vitest";

declare module "vitest" {
  interface Assertion<T = unknown> {
    toBeNullish(): T;
  }
}

// Extend Jest matchers for @testing-library/jest-dom compatibility
declare global {
  namespace jest {
    interface Matchers<R = void> {
      toBeNullish(): R;
    }
  }
}
