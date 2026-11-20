import type {
  ManagedMod,
  NexusModsFileCategory,
  NexusModsLatestModFileInfo,
  NexusModsModFile,
  NexusModsModFileInfo,
  NexusModsModInfo,
} from "@/commands/bindings";
import {
  determineLatestModVersion,
  groupModFilesByCategory,
  isModInstallOutdated,
  ModInfoMap,
  parseNexusModsUrl,
} from "@/utils/nexusmods";

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

function createModinfo(
  gameScopedId: number,
  version = "1.0",
): NexusModsModInfo {
  return { gameDomain: "fallout76", gameScopedId, version } as NexusModsModInfo;
}

function createLatestFile(
  fileId: number,
  version = "1.0",
): NexusModsLatestModFileInfo {
  return {
    gameDomain: "fallout76",
    gameScopedId: 546,
    fileId,
    name: `file-${fileId}`,
    version,
    category: null,
  };
}

function createModfile(
  overrides: Partial<NexusModsModFileInfo> = {},
): NexusModsModFileInfo {
  return {
    gameDomain: "fallout76",
    gameScopedId: 546,
    fileId: 100,
    name: "file-100",
    version: "1.0",
    category: "MAIN",
    ...overrides,
  };
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

describe("determineLatestModVersion", () => {
  it("prefers the latest file's version over the file's and the mod's version", () => {
    const modfile = createModfile({
      version: "1.0",
      latestFile: createLatestFile(200, "3.0"),
    });
    const modinfo = createModinfo(546, "2.0");
    expect(determineLatestModVersion({ modinfo, modfile })).toBe("3.0");
  });

  it("falls back to the file's version, then to the mod's version", () => {
    expect(
      determineLatestModVersion({
        modinfo: createModinfo(546, "2.0"),
        modfile: createModfile({ version: "1.0" }),
      }),
    ).toBe("1.0");
    expect(
      determineLatestModVersion({ modinfo: createModinfo(546, "2.0") }),
    ).toBe("2.0");
  });

  it("skips empty version strings", () => {
    const modfile = createModfile({
      version: "1.0",
      latestFile: createLatestFile(200, ""),
    });
    expect(
      determineLatestModVersion({
        modinfo: createModinfo(546, "2.0"),
        modfile,
      }),
    ).toBe("1.0");
  });

  it("returns undefined when no info is available", () => {
    expect(determineLatestModVersion({})).toBeUndefined();
  });
});

describe("isModInstallOutdated", () => {
  const nexusUrl = "https://www.nexusmods.com/fallout76/mods/546";
  const createNexusMod = (overrides: Partial<ManagedMod> = {}) =>
    createMod({ url: nexusUrl, nexusFileId: 100, ...overrides });

  describe("file updates of the tracked file", () => {
    it("is outdated when a file update exists for the tracked file ID, even if the version is unchanged", () => {
      const mod = createNexusMod({ version: "1.0" });
      const modfile = createModfile({
        fileId: 100,
        version: "1.0",
        latestFile: createLatestFile(200, "1.0"),
      });
      expect(
        isModInstallOutdated({
          mod,
          modinfo: createModinfo(546, "1.0"),
          modfile,
        }),
      ).toBe(true);
    });

    it("is outdated when a file update exists and the latest version differs", () => {
      const mod = createNexusMod({ version: "1.0" });
      const modfile = createModfile({
        fileId: 100,
        version: "1.0",
        latestFile: createLatestFile(200, "2.0"),
      });
      expect(isModInstallOutdated({ mod, modfile })).toBe(true);
    });

    it("is outdated via file update even when the installed version is empty", () => {
      const mod = createNexusMod({ version: "" });
      const modfile = createModfile({
        fileId: 100,
        latestFile: createLatestFile(200, "2.0"),
      });
      expect(isModInstallOutdated({ mod, modfile })).toBe(true);
    });

    it("is not outdated when the tracked file is already the latest", () => {
      const mod = createNexusMod({ version: "1.0" });
      expect(
        isModInstallOutdated({
          mod,
          modinfo: createModinfo(546, "1.0"),
          modfile: createModfile({ latestFile: null }),
        }),
      ).toBe(false);
      expect(
        isModInstallOutdated({
          mod,
          modinfo: createModinfo(546, "1.0"),
          modfile: createModfile({ latestFile: undefined }),
        }),
      ).toBe(false);
    });

    it("ignores latestFile when its file ID equals the tracked file ID", () => {
      const mod = createNexusMod({ version: "1.0" });
      const modfile = createModfile({
        fileId: 100,
        latestFile: createLatestFile(100, "1.0"),
      });
      expect(isModInstallOutdated({ mod, modfile })).toBe(false);
    });

    it("ignores latestFile when the given modfile is not the tracked file", () => {
      const mod = createNexusMod({ nexusFileId: 100, version: "1.0" });
      const modfile = createModfile({
        fileId: 999,
        version: "1.0",
        latestFile: createLatestFile(200, "1.0"),
      });
      expect(isModInstallOutdated({ mod, modfile })).toBe(false);
    });

    it("ignores file updates when the mod has no tracked file ID", () => {
      const modfile = createModfile({
        fileId: 100,
        version: "1.0",
        latestFile: createLatestFile(200, "1.0"),
      });
      expect(
        isModInstallOutdated({
          mod: createNexusMod({ nexusFileId: undefined, version: "1.0" }),
          modfile,
        }),
      ).toBe(false);
      expect(
        isModInstallOutdated({
          mod: createNexusMod({ nexusFileId: null, version: "1.0" }),
          modfile,
        }),
      ).toBe(false);
    });
  });

  describe("version comparison", () => {
    it("is outdated when the latest mod version differs from the installed version", () => {
      const mod = createNexusMod({ nexusFileId: undefined, version: "1.0" });
      expect(
        isModInstallOutdated({ mod, modinfo: createModinfo(546, "2.0") }),
      ).toBe(true);
    });

    it("is outdated when the tracked file's version differs from the installed version", () => {
      const mod = createNexusMod({ version: "1.0" });
      const modfile = createModfile({ fileId: 100, version: "2.0" });
      expect(isModInstallOutdated({ mod, modfile })).toBe(true);
    });

    it("is not outdated when the installed version matches the latest version", () => {
      expect(
        isModInstallOutdated({
          mod: createNexusMod({ nexusFileId: undefined, version: "2.0" }),
          modinfo: createModinfo(546, "2.0"),
        }),
      ).toBe(false);
    });

    it("prefers the tracked file's version over the mod's version", () => {
      const mod = createNexusMod({ version: "1.0" });
      const modfile = createModfile({ fileId: 100, version: "1.0" });
      expect(
        isModInstallOutdated({
          mod,
          modinfo: createModinfo(546, "2.0"),
          modfile,
        }),
      ).toBe(false);
    });

    it("is not outdated when no remote info is available, even if the installed version is set", () => {
      expect(isModInstallOutdated({ mod: createNexusMod() })).toBe(false);
      expect(isModInstallOutdated({ mod: createMod({ url: "" }) })).toBe(false);
    });

    it("is not outdated when the installed version is empty and no file update exists", () => {
      const modinfo = createModinfo(546, "2.0");
      expect(
        isModInstallOutdated({ mod: createNexusMod({ version: "" }), modinfo }),
      ).toBe(false);
      expect(
        isModInstallOutdated({
          mod: createNexusMod({ version: "   " }),
          modinfo,
        }),
      ).toBe(false);
    });
  });
});

function createModFile(
  fileId: number,
  category: NexusModsFileCategory | null = "MAIN",
): NexusModsModFile {
  return {
    id: [],
    uid: fileId,
    fileId,
    name: `file-${fileId}`,
    version: "1.0",
    categoryId: 1,
    categoryName: category,
    category,
    isPrimary: false,
    size: 0,
    fileName: `file-${fileId}.zip`,
    uploadedTime: "2026-10-25T14:51:00.000+00:00",
    modVersion: "1.0",
    externalVirusScanUrl: null,
    description: "",
    sizeKb: 0,
    sizeInBytes: null,
    changelogHtml: null,
    contentPreviewLink: null,
  };
}

describe("groupModFilesByCategory", () => {
  it("filters out archived files", () => {
    const groups = groupModFilesByCategory([
      createModFile(1, "MAIN"),
      createModFile(2, "ARCHIVED"),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.files.map((f) => f.fileId)).toEqual([1]);
  });

  it("groups files by category and orders the groups", () => {
    const groups = groupModFilesByCategory([
      createModFile(1, "OLD_VERSION"),
      createModFile(2, "MAIN"),
      createModFile(3, "OPTIONAL"),
      createModFile(4, "MAIN"),
      createModFile(5, null),
    ]);
    expect(groups.map((g) => g.category)).toEqual([
      "MAIN",
      "OPTIONAL",
      "OLD_VERSION",
      null,
    ]);
    expect(groups[0]?.files.map((f) => f.fileId)).toEqual([2, 4]);
    expect(groups[3]?.files.map((f) => f.fileId)).toEqual([5]);
  });

  it("returns an empty array when there are no files", () => {
    expect(groupModFilesByCategory([])).toEqual([]);
  });

  it("returns an empty array when all files are archived", () => {
    expect(
      groupModFilesByCategory([
        createModFile(1, "ARCHIVED"),
        createModFile(2, "ARCHIVED"),
      ]),
    ).toEqual([]);
  });
});
