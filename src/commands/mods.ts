import { commands } from "./bindings";

/** Wrapper around exported commands from Rust. */
const Mods = {
  metadata: {
    load: commands.modsLoadMetadata,
    loadOrDefaults: commands.modsLoadMetadataOrDefault,
    save: commands.modsSaveMetadata,
  },
  resourceList: {
    loadFromIni: commands.resourcelistLoadFromIni,
    saveToIni: commands.resourcelistSaveToIni,
    loadFromTextFile: commands.resourcelistLoadFromTextFile,
    saveToTextFile: commands.resourcelistSaveToTextFile,
    switchIniKeys: commands.resourcelistSwitchIniKeys,
    getUnlistedArchives: commands.resourcelistGetUnlistedArchives,
    addUnlistedArchives: commands.resourcelistAddUnlistedArchives,
    removeNonExistantArchives: commands.resourcelistRemoveNonExistantArchives,
    addGameVoicesArchives: commands.resourcelistAddGameVoicesArchives,
    removeGameArchives: commands.resourcelistRemoveGameArchives,
  },
  actions: {
    deploy: commands.modsDeploy,
    mod: {
      uninstall: commands.modsUninstallMod,
      renameFolder: commands.modsRenameModFolder,
    },
    installation: {
      installFromTempFolder: commands.modsInstallFromTempFolder,
      installFromExistingArchives: commands.modsInstallFromExistingArchives,
    },
    tempFolder: {
      createFromFiles: commands.modsCreateTempFolderFromFilesOrFolders,
      createFromFileOrArchive: commands.modsCreateTempFolderFromFileOrArchive,
      createFromFolder: commands.modsCreateTempFolderFromFolderContents,
      listContent: commands.modsListTempFolderContents,
      uncheckUnneededEntries: commands.modsUncheckUnneededEntries,
      detectRootFolder: commands.modsDetectRootFolder,
      diagnoseIssues: commands.modsDiagnoseIssues,
      delete: commands.modsDeleteTempFolder,
    },
  },
  legacy: {
    detectMigrationState: commands.modsDetectMigrationState,
    migrateMods: commands.modsMigrateLegacyManagedMods,
    removeMods: commands.modsRemoveLegacyManagedMods,
  },
  utils: {
    autoPackBa2Archives: commands.modsUtilsPackBa2Archives,
    getConflictingFiles: commands.modsUtilsGetConflictingFiles,
    getDeployedArchives: commands.modsUtilsGetDeployedArchives,
  },
};

export default Mods;
