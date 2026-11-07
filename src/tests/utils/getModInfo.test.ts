import type { ManagedMod, NexusModsModInfo } from "@/commands/bindings";
import {
  createModinfoMap,
  getModIdFromUrl,
  getModInfo,
  getModInfoFromMap,
} from "@/views/mods/tabs/modOrder/utils/getModInfo";

function createMod(overrides: Partial<ManagedMod> = {}): ManagedMod {
  return {
    key: "key",
    title: "title",
    folderName: "folder",
    version: "1.0",
    url: "",
    notes: "",
    enabled: true,
    options: { rootFolder: "" },
    ...overrides,
  };
}

function createModinfo(gameScopedId: number): NexusModsModInfo {
  return { gameScopedId } as NexusModsModInfo;
}

describe("getModIdFromUrl", () => {
  it("extracts the mod ID from a NexusMods URL", () => {
    expect(
      getModIdFromUrl("https://www.nexusmods.com/fallout76/mods/546?tab=files"),
    ).toBe(546);
    expect(
      getModIdFromUrl("https://www.nexusmods.com/fallout76/mods/546"),
    ).toBe(546);
  });

  it("returns undefined for invalid URLs", () => {
    expect(getModIdFromUrl("")).toBeUndefined();
    expect(getModIdFromUrl("https://example.com/mods/546")).toBeUndefined();
    expect(
      getModIdFromUrl("https://www.nexusmods.com/fallout76/mods/abc"),
    ).toBeUndefined();
  });
});

describe("getModInfo / getModInfoFromMap", () => {
  const mod = createMod({
    url: "https://www.nexusmods.com/fallout76/mods/546?tab=files",
  });
  const modinfos = [createModinfo(123), createModinfo(546)];

  it("finds the mod info by the mod ID from the URL", () => {
    expect(getModInfo(mod, modinfos)?.gameScopedId).toBe(546);
    expect(
      getModInfoFromMap(mod, createModinfoMap(modinfos))?.gameScopedId,
    ).toBe(546);
  });

  it("returns undefined when there is no matching mod info", () => {
    expect(getModInfo(mod, [createModinfo(123)])).toBeUndefined();
    expect(getModInfo(mod, null)).toBeUndefined();
    expect(getModInfo(mod, undefined)).toBeUndefined();
    expect(getModInfoFromMap(mod, createModinfoMap(null))).toBeUndefined();
  });

  it("returns undefined when the mod has no NexusMods URL", () => {
    const localMod = createMod({ url: "" });
    expect(getModInfo(localMod, modinfos)).toBeUndefined();
    expect(
      getModInfoFromMap(localMod, createModinfoMap(modinfos)),
    ).toBeUndefined();
  });
});
