import { commands } from "./bindings";

export async function isRelease() {
  return !(await commands.isDebug());
}

/**
 * Returns the file size in number of bytes
 */
export async function getFileSize(path: string) {
  return parseInt(await commands.getFileSize(path));
}
