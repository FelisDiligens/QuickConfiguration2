import "@testing-library/jest-dom";
import { vi } from "vitest";
import createFetchMock from "vitest-fetch-mock";

const fetchMocker = createFetchMock(vi);
fetchMocker.enableMocks();

const originalGetComputedStyle = window.getComputedStyle.bind(window);
const durationOrDelayPattern = /^(?:transition|animation)-(?:duration|delay)$/;
const hyphenate = (name: string) =>
  name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

vi.spyOn(window, "getComputedStyle").mockImplementation(
  (element, pseudoElement) => {
    const styles = originalGetComputedStyle(element, pseudoElement);
    return new Proxy(styles, {
      get(target, property) {
        if (property === "getPropertyValue") {
          return (name: string) => {
            const value = target.getPropertyValue(name);
            return value === "" && durationOrDelayPattern.test(name)
              ? "0s"
              : value;
          };
        }
        const value = Reflect.get(target, property, target) as unknown;
        if (typeof value === "function") return value.bind(target);
        if (
          value === "" &&
          typeof property === "string" &&
          durationOrDelayPattern.test(hyphenate(property))
        ) {
          return "0s";
        }
        return value;
      },
    }) as CSSStyleDeclaration;
  },
);

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
