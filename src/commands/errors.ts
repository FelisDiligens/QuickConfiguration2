import objectInspect from "object-inspect";
import { CommandError, SerializableCommandResult } from "./bindings";

export type AnyError = CommandError | Error | string | null | undefined;

/** Returns the "ok" value or throws the "error" value. */
export function unwrap<T>(result: SerializableCommandResult<T>): T {
  switch (result.status) {
    case "ok":
      return result.value;
    case "error":
      throw result.status;
  }
}

export function isAnyError(error: unknown): error is AnyError {
  return (
    error === undefined ||
    error === null ||
    typeof error === "string" ||
    error instanceof Error ||
    (typeof error === "object" &&
      "type" in error &&
      "message" in error &&
      typeof error.type === "string" &&
      (typeof error.message === "string" || typeof error.message === "object"))
  );
}

/**
 * Return a (formatted) message of the given error.
 * @param error any error that got thrown or from a promise rejection
 * @returns an error message
 */
export function commandErrorToString(error: AnyError) {
  if (error === undefined) {
    return "undefined";
  } else if (error === null) {
    return "null";
  } else if (typeof error === "string") {
    return error;
  } else if (error instanceof Error) {
    return error.message;
  } else if (
    "type" in error &&
    "message" in error &&
    "variant" in error &&
    typeof error.message === "string" &&
    typeof error.variant === "string"
  ) {
    return `${error.type}::${error.variant}: ${error.message}`;
  } else if (
    "type" in error &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    if (error.type === "Anyhow" || error.type === "String")
      return error.message;
    return `${error.type}: ${error.message}`;
  } else if (error.type === "IniParseError") {
    const { fileName, line, col, msg } = error;
    if (fileName) return `${error.type}: ${fileName}:${line}:${col} ${msg}`;
    return `${error.type}: ${line}:${col} ${msg}`;
  } else {
    return objectInspect(error, { depth: 2 });
  }
}

export function commandErrorIsType(
  error: AnyError,
  type: CommandError["type"],
): boolean {
  if (!error || typeof error === "string" || error instanceof Error)
    return false;
  return error.type === type;
}

export type TranslationParseError = Extract<
  CommandError,
  { type: "TranslationParseError" }
>;
export function commandErrorIsTranslationParseError(
  error: AnyError,
): error is TranslationParseError {
  if (!error || typeof error === "string" || error instanceof Error)
    return false;
  return error.type === "TranslationParseError";
}

export type IniParseError = Extract<CommandError, { type: "IniParseError" }>;
export function commandErrorIsIniParseError(
  error: AnyError,
): error is IniParseError {
  if (!error || typeof error === "string" || error instanceof Error)
    return false;
  return error.type === "IniParseError";
}

export type Archive2Error = Extract<CommandError, { type: "Archive2Error" }>;
export function commandErrorIsArchive2Error(
  error: AnyError,
): error is Archive2Error {
  if (!error || typeof error === "string" || error instanceof Error)
    return false;
  return error.type === "Archive2Error";
}
