import { unwrapOr } from "@/utils";
import { IniFile, commands } from "./bindings";

/**
 * Searches multiple ini files and returns the first result.
 */
async function findInt(
  iniFiles: IniFile[],
  section: string | null,
  key: string,
) {
  for (const iniFile of iniFiles) {
    const value = await commands.iniGetInt(iniFile, section, key);
    if (value != null) return value;
  }
  return null;
}

/**
 * Searches multiple ini files and returns the first result.
 */
async function findFloat(
  iniFiles: IniFile[],
  section: string | null,
  key: string,
) {
  for (const iniFile of iniFiles) {
    const value = await commands.iniGetFloat(iniFile, section, key);
    if (value != null) return value;
  }
  return null;
}

/**
 * Searches multiple ini files and returns the first result.
 */
async function findBoolean(
  iniFiles: IniFile[],
  section: string | null,
  key: string,
) {
  for (const iniFile of iniFiles) {
    const value = await commands.iniGetBoolean(iniFile, section, key);
    if (value != null) return value;
  }
  return null;
}

/**
 * Searches multiple ini files and returns the first result.
 */
async function findString(
  iniFiles: IniFile[],
  section: string | null,
  key: string,
) {
  for (const iniFile of iniFiles) {
    const value = await commands.iniGetString(iniFile, section, key);
    if (value != null) return value;
  }
  return null;
}

/**
 * Sets the value only if it already exists in the ini file.
 * If it doesn't exist, do nothing.
 */
async function setIntIfPresent(
  iniFile: IniFile,
  section: string | null,
  key: string,
  value: number,
) {
  const currentValue = await commands.iniGetInt(iniFile, section, key);
  if (currentValue != null && currentValue != value) {
    await commands.iniSetInt(iniFile, section, key, value);
  }
}

/**
 * Sets the value only if it already exists in the ini file.
 * If it doesn't exist, do nothing.
 */
async function setFloatIfPresent(
  iniFile: IniFile,
  section: string | null,
  key: string,
  value: number,
) {
  const currentValue = await commands.iniGetFloat(iniFile, section, key);
  if (currentValue != null && currentValue != value) {
    await commands.iniSetFloat(iniFile, section, key, value);
  }
}

/**
 * Sets the value only if it already exists in the ini file.
 * If it doesn't exist, do nothing.
 */
async function setBooleanIfPresent(
  iniFile: IniFile,
  section: string | null,
  key: string,
  value: boolean,
) {
  const currentValue = await commands.iniGetBoolean(iniFile, section, key);
  if (currentValue != null && currentValue != value) {
    await commands.iniSetBoolean(iniFile, section, key, value);
  }
}

/**
 * Sets the value only if it already exists in the ini file.
 * If it doesn't exist, do nothing.
 */
async function setStringIfPresent(
  iniFile: IniFile,
  section: string | null,
  key: string,
  value: string,
) {
  const currentValue = await commands.iniGetString(iniFile, section, key);
  if (currentValue != null && currentValue != value) {
    await commands.iniSetString(iniFile, section, key, value);
  }
}

/** Wrapper around exported commands from Rust. */
const ini = {
  getInt: commands.iniGetInt,
  getIntWithDefault: async (
    iniFile: IniFile,
    section: string | null,
    key: string,
    defaultValue: number,
  ) => unwrapOr(await commands.iniGetInt(iniFile, section, key), defaultValue),
  setInt: commands.iniSetInt,
  setIntIfPresent,
  findInt,
  findIntWithDefault: async (
    iniFiles: IniFile[],
    section: string | null,
    key: string,
    defaultValue: number,
  ) => unwrapOr(await findInt(iniFiles, section, key), defaultValue),
  getFloat: commands.iniGetFloat,
  getFloatWithDefault: async (
    iniFile: IniFile,
    section: string | null,
    key: string,
    defaultValue: number,
  ) =>
    unwrapOr(await commands.iniGetFloat(iniFile, section, key), defaultValue),
  setFloat: commands.iniSetFloat,
  setFloatIfPresent,
  findFloat,
  findFloatWithDefault: async (
    iniFiles: IniFile[],
    section: string | null,
    key: string,
    defaultValue: number,
  ) => unwrapOr(await findFloat(iniFiles, section, key), defaultValue),
  getString: commands.iniGetString,
  getStringWithDefault: async (
    iniFile: IniFile,
    section: string | null,
    key: string,
    defaultValue: string,
  ) =>
    unwrapOr(await commands.iniGetString(iniFile, section, key), defaultValue),
  setString: commands.iniSetString,
  setStringIfPresent,
  findString,
  findStringWithDefault: async (
    iniFiles: IniFile[],
    section: string | null,
    key: string,
    defaultValue: string,
  ) => unwrapOr(await findString(iniFiles, section, key), defaultValue),
  getBoolean: commands.iniGetBoolean,
  getBooleanWithDefault: async (
    iniFile: IniFile,
    section: string | null,
    key: string,
    defaultValue: boolean,
  ) =>
    unwrapOr(await commands.iniGetBoolean(iniFile, section, key), defaultValue),
  setBoolean: commands.iniSetBoolean,
  setBooleanIfPresent,
  findBoolean,
  findBooleanWithDefault: async (
    iniFiles: IniFile[],
    section: string | null,
    key: string,
    defaultValue: boolean,
  ) => unwrapOr(await findBoolean(iniFiles, section, key), defaultValue),
  delete: commands.iniDeleteKey,
  has: commands.iniHasKey,
};

export default ini;
