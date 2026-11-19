import type { ManagedMod, NexusModsModInfo } from "@/commands/bindings";
import { ModInfoMap, parseNexusModsUrl } from "@/utils/nexusmods";

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
  return { gameDomain: "fallout76", gameScopedId } as NexusModsModInfo;
}

describe("parseNexusModsUrl", () => {
  it("extracts the game domain and game-scoped ID from a NexusMods URL", () => {
    const parsed1 = parseNexusModsUrl(
      "https://www.nexusmods.com/fallout76/mods/546?tab=files",
    );
    expect(parsed1).not.toBeNullish();
    expect(parsed1?.gameDomain).toBe("fallout76");
    expect(parsed1?.gameScopedId).toBe(546);

    const parsed2 = parseNexusModsUrl(
      "https://www.nexusmods.com/skyrimspecialedition/mods/6194",
    );
    expect(parsed2).not.toBeNullish();
    expect(parsed2?.gameDomain).toBe("skyrimspecialedition");
    expect(parsed2?.gameScopedId).toBe(6194);
  });

  it("returns undefined for invalid URLs", () => {
    expect(parseNexusModsUrl("")).toBeUndefined();
    expect(parseNexusModsUrl("https://example.com/mods/546")).toBeUndefined();
    expect(
      parseNexusModsUrl("https://www.nexusmods.com/fallout76/mods/abc"),
    ).toBeUndefined();
  });
});

describe("ModInfoMap", () => {
  const mod = createMod({
    url: "https://www.nexusmods.com/fallout76/mods/546?tab=files",
  });
  const modinfos = [createModinfo(123), createModinfo(546)];

  it("finds the mod info by the IDs from the URL", () => {
    const map = new ModInfoMap(modinfos);
    expect(map.get(mod)?.gameScopedId).toBe(546);
  });

  it("returns undefined when there is no matching mod info", () => {
    const emptyMap = new ModInfoMap(null);
    expect(emptyMap.get(mod)).toBeUndefined();

    const map = new ModInfoMap([createModinfo(123)]);
    expect(map.get(mod)).toBeUndefined();
  });

  it("returns undefined when the mod has no NexusMods URL", () => {
    const localMod = createMod({ url: "" });
    const map = new ModInfoMap(modinfos);
    expect(map.get(localMod)).toBeUndefined();
  });
});
