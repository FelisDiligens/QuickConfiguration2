import { family } from "@tauri-apps/plugin-os";

/** Wraps `setTimeout` so it can be used like: `await sleep(500);` */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param startAt Inclusive
 * @param endAt Exclusive
 * @returns {number[]} an array with numbers from `startAt` to `endAt` (excluding `endAt`).
 */
export function range(startAt: number, endAt: number) {
  return [...Array(endAt - startAt).keys()].map((i) => i + startAt);
}

export function getPathSep() {
  return family() == "windows" ? "\\" : "/";
}

export function pathJoinSync(...paths: string[]) {
  const pathSep = getPathSep();
  return paths.join(pathSep).replace(/[\\/]+/g, pathSep);
}

export function pathStripPrefixSync(basePath: string, path: string): string {
  return path.replace(basePath, "").replace(/^[\\/]/, "") || ".";
}

/** If the given value is null or undefined then it returns the defaultValue. */
export function unwrapOr<T>(value: T | null | undefined, defaultValue: T): T {
  return value !== null && value !== undefined ? value : defaultValue;
}

/** Formats a number of bytes into a human-readable string. */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "kiB", "MiB", "GiB", "TiB", "PiB"];
  const threshold = 1024;
  let value = bytes;
  let unitIndex = 0;

  while (value >= threshold && unitIndex < units.length - 1) {
    value /= threshold;
    unitIndex++;
  }

  const formattedValue =
    value < 10 && unitIndex > 0 ? value.toFixed(2) : Math.floor(value);
  return `${formattedValue} ${units[unitIndex]}`;
}
