import packageInfo from "@/../package.json";

export const info = {
  version: packageInfo.version,
  author: packageInfo.author,
};

export const urls = {
  github: {
    repo: "https://github.com/FelisDiligens/QuickConfiguration2",
  },
  wiki: {
    home: "https://github.com/FelisDiligens/QuickConfiguration2/wiki",
    pages: {
      nexusmodsLoginFailed:
        "https://github.com/FelisDiligens/QuickConfiguration2/wiki/Troubleshooting:-Login-with-NexusMods-failed",
    },
  },
  nexusmods: {
    home: "https://www.nexusmods.com/fallout76/mods/546",
    bugs: "https://www.nexusmods.com/fallout76/mods/546?tab=bugs",
  },
  changelog:
    "https://raw.githubusercontent.com/FelisDiligens/QuickConfiguration2/main/CHANGELOG.md",
  donate: "https://ko-fi.com/felisdiligens",
  requirements: {
    visualCppRedist:
      "https://www.microsoft.com/en-us/download/details.aspx?id=30679",
    wineMono: "https://dl.winehq.org/wine/wine-mono/",
  },
  other: {
    bethesdaStatus: "https://bethesda.net/status",
    nukesAndDragonsBuildPlanner:
      "https://nukesdragons.com/fallout-76/character",
    nukacrypt: "https://nukacrypt.com/",
    map76: "https://map76.com/",
    xTranslator: "https://www.nexusmods.com/skyrimspecialedition/mods/134",
  },
};
