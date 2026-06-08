/*
 * Forward all console.log (and friends) messages to the Tauri log plugin.
 * All frontend messages will be logged to STDOUT and a file.
 * https://v2.tauri.app/plugin/logging/
 */

// See: https://github.com/tauri-apps/plugins-workspace/blob/v2/plugins/log/guest-js/index.ts

import { invoke } from "@tauri-apps/api/core";
import { LogLevel, LogOptions } from "@tauri-apps/plugin-log";
import objectInspect from "object-inspect";

/** Information about a call site including function name, file name, line number and column number. */
interface CallSite {
  func: string;
  file: string;
  line: string;
  col: string;
}

/**
 * Extracts call site information from a "raw" stack trace.
 * @param stack The "raw" stack trace, e.g. `(new Error()).stack`
 * @param startAtDepth The beginning index of the specified portion of the stack trace. If undefined, then it starts with the first (index 0).
 * @param endAtDepth The end index of the specified portion of the stack trace. This is exclusive of the element at the index 'end'. If undefined, then the slice extends to the end of the stack trace.
 * @returns An array of information about call sites including function name, file name, line number and column number.
 */
function getStackTrace(
  stack?: string,
  startAtDepth?: number,
  endAtDepth?: number,
): CallSite[] {
  if (!stack) {
    return [];
  }

  if (stack.startsWith("Error")) {
    // Assume it's Chromium V8
    //
    // Error
    //     at baz (filename.js:10:15)
    //     at bar (filename.js:6:3)
    //     at foo (filename.js:2:3)
    //     at filename.js:13:1

    const lines = stack
      .split("\n")
      .slice(1) // ignore first "Error" line
      .slice(startAtDepth, endAtDepth);

    const regex =
      /at\s+(?<func>.*?)\s+\((?<file>.*?):(?<line>\d+):(?<col>\d+)\)/;
    const regexNoFunction = /at\s+(?<file>.*?):(?<line>\d+):(?<col>\d+)/;

    const traceback: CallSite[] = [];

    for (const line of lines) {
      const match = line.trim().match(regex);
      if (match) {
        const { func, file, line, col } = match.groups as {
          func: string;
          file: string;
          line: string;
          col: string;
        };
        traceback.push({ func, file, line, col });
      } else {
        // Handle cases where the regex does not match (e.g., last line without function name)
        const match = line.match(regexNoFunction);
        if (match) {
          const { file, line, col } = match.groups as {
            file: string;
            line: string;
            col: string;
          };
          traceback.push({
            func: "",
            file,
            line,
            col,
          });
        }
      }
    }
    return traceback;
  } else {
    // Assume it's Webkit JavaScriptCore, example:
    //
    // baz@filename.js:10:24
    // bar@filename.js:6:6
    // foo@filename.js:2:6
    // global code@filename.js:13:4

    const lines = stack.split("\n").slice(startAtDepth, endAtDepth);

    const regex = /(?<func>.*?)@(?<file>.*):(?<line>\d+):(?<col>\d+)/;

    const traceback: CallSite[] = [];

    for (const line of lines) {
      const match = line.trim().match(regex);
      if (match) {
        const { func, file, line, col } = match.groups as {
          func: string;
          file: string;
          line: string;
          col: string;
        };
        traceback.push({ func, file, line, col });
      } else {
        // reduceRight@[native code]
        // global code@
        const splits = line.trim().split("@");
        if (
          splits.length == 2 &&
          splits[1].includes("[") &&
          splits[1].includes("]")
        ) {
          traceback.push({
            func: splits[0],
            file: splits[1],
            line: "0",
            col: "0",
          });
        }
      }
    }
    return traceback;
  }

  // Firefox, for reference (quite similar to webkit):
  //
  // foo@debugger eval code:1:31
  // @debugger eval code:1:1
  // bar@file:///home/user/work/filename.js:2:15
  // @file:///home/user/work/filename.js:5:1
}

export type ExtendedLogOptions = LogOptions & { location: string };

async function log(
  level: LogLevel,
  message: string,
  options?: ExtendedLogOptions,
) {
  const location =
    options?.location ||
    (() => {
      const location = getStackTrace(new Error().stack, 3, 10)
        .filter(
          (callSite) =>
            !callSite.file.endsWith("src/lib/logging.ts") ||
            !["log", "trace", "debug", "info", "warn", "error", ""].includes(
              callSite.func,
            ),
        )
        .at(0);
      if (location) {
        const { line, col } = location;
        let { func, file } = location;
        func = func || "<unknown>";
        file = file.replace(/^(http|tauri):\/\/localhost(:\d{2,4})?\//, "");
        return `${func}@${file}:${line}:${col}`;
      }
      return "<unknown>";
    })();

  const { file, line, keyValues } = options ?? {};

  await invoke("plugin:log|log", {
    level,
    message,
    location,
    file,
    line,
    keyValues,
  });
}

/** Logs a message at the error level.*/
export async function error(
  message: string,
  options?: ExtendedLogOptions,
): Promise<void> {
  await log(LogLevel.Error, message, options);
}

/** Logs a message at the warn level.*/
export async function warn(
  message: string,
  options?: ExtendedLogOptions,
): Promise<void> {
  await log(LogLevel.Warn, message, options);
}

/** Logs a message at the info level.*/
export async function info(
  message: string,
  options?: ExtendedLogOptions,
): Promise<void> {
  await log(LogLevel.Info, message, options);
}

/** Logs a message at the debug level.*/
export async function debug(
  message: string,
  options?: ExtendedLogOptions,
): Promise<void> {
  await log(LogLevel.Debug, message, options);
}

/** Logs a message at the trace level.*/
export async function trace(
  message: string,
  options?: ExtendedLogOptions,
): Promise<void> {
  await log(LogLevel.Trace, message, options);
}

/** Regular expressions that when matching an output string, should not be written to the log. */
const ignorePatterns = [
  /^i18next: initialized /,
  /i18next is maintained/,
  /^i18next::backendConnector: loaded namespace translation/,
];

/**
 * Wraps `console` logging functions, builds a string from the arguments and passes it to the user-defined `logger` function.
 * @param fnName Name of the `console` function, e.g. `"log"` for `console.log`.
 * @param logger A logger function which gets called with a formatted string.
 */
function forwardConsole(
  fnName: "log" | "debug" | "info" | "warn" | "error",
  logger: (message: string) => Promise<void>,
) {
  const original = console[fnName];
  console[fnName] = (...args) => {
    original(...args);
    // TODO: Handle formatting strings with `%s`, `%o`. React seems to love these...
    const formattedMessage = args
      .map((message) =>
        typeof message == "string"
          ? message
          : objectInspect(message, { depth: 0 }),
      )
      .join(" ");
    if (!ignorePatterns.find((regexp) => regexp.test(formattedMessage))) {
      logger(formattedMessage).catch((reason) =>
        original("Promise of log plugin rejected: ", reason),
      );
    }
  };
}

// Forward all console logging functions to Tauri log plugin:
forwardConsole("log", trace);
forwardConsole("debug", debug);
forwardConsole("info", info);
forwardConsole("warn", warn);
forwardConsole("error", error);
