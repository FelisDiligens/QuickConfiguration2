import { Nullish } from "@/types";
import { family } from "@tauri-apps/plugin-os";

/** Wraps `setTimeout` so it can be used like: `await sleep(500);` */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Whether UI animations (e.g. the modal fade) are enabled. Disabled under
 * vitest (`import.meta.env.MODE === "test"`), where jsdom reports empty
 * transition durations and react-bootstrap ends up calling `setTimeout`
 * with `NaN`. Enabled in dev and production builds.
 */
export const animationsEnabled = import.meta.env.MODE !== "test";

/**
 * @param startAt Inclusive
 * @param endAt Exclusive
 * @returns {number[]} an array with numbers from `startAt` to `endAt` (excluding `endAt`).
 */
export function range(startAt: number, endAt: number) {
  return [...Array(endAt - startAt).keys()].map((i) => i + startAt);
}

export function pathJoinSync(...paths: string[]) {
  const isWindows = family() === "windows";
  const pathSep = isWindows ? "\\" : "/";
  // UNC path handling:
  if (isWindows) {
    const rootPath = paths.at(0);
    if (rootPath?.startsWith("\\\\")) {
      return (
        "\\\\" +
        [rootPath.substring(2), ...paths.slice(1)]
          .join(pathSep)
          .replace(/[\\/]+/g, pathSep)
      );
    }
  }
  return paths.join(pathSep).replace(/[\\/]+/g, pathSep);
}

export function pathStripPrefixSync(basePath: string, path: string): string {
  return path.replace(basePath, "").replace(/^[\\/]/, "") || ".";
}

/** If the given value is null or undefined then it returns the defaultValue. */
export function unwrapOr<T>(value: Nullish<T>, defaultValue: T): T {
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

/** Formats a duration given in milliseconds into a human-readable string. */
export function formatDuration(ms: number): string {
  const seconds = ms / 1000;
  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60);
    const restSeconds = Math.round(seconds % 60);
    return `${minutes} min ${restSeconds} s`;
  }
  return seconds < 10 ? `${seconds.toFixed(1)} s` : `${Math.round(seconds)} s`;
}
