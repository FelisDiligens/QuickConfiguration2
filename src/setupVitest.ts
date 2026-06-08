import "@testing-library/jest-dom";
import { vi } from "vitest";
import createFetchMock from "vitest-fetch-mock";

const fetchMocker = createFetchMock(vi);
fetchMocker.enableMocks();

expect.extend({
  toBeNullish(received) {
    const { isNot } = this;
    return {
      // do not alter your "pass" based on isNot. Vitest does it for you
      pass: received == null,
      message: () => `expected ${received}${isNot ? " not" : ""} to be nullish`,
    };
  },
});
