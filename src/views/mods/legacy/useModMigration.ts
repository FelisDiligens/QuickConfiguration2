import { commands, events } from "@/commands/bindings";
import { AnyError } from "@/commands/errors";
import Mods from "@/commands/mods";
import { useProfilesStore } from "@/stores/profiles";
import { UnlistenFn } from "@tauri-apps/api/event";
import { useTranslation } from "react-i18next";
import { loadingModal } from "../../../hooks/useModal";

export function useModMigration(options: {
  onSuccess?: () => void;
  onError?: (error: AnyError) => void;
}) {
  const { t } = useTranslation();

  const getValidatedPaths = async () => {
    const modsPath = useProfilesStore.getState().getModsPath();
    const gamePath = useProfilesStore.getState().getGamePath();
    if (!modsPath || !gamePath)
      throw new Error(t("mods.errors.unsetModsPathOrGamePath"));
    if (!(await commands.isPathValid(gamePath)))
      throw new Error(t("errors.path.game.invalid", { path: gamePath }));
    if (!(await commands.isDirectory(gamePath)))
      throw new Error(t("errors.path.game.missing", { path: gamePath }));
    if (!(await commands.validateGamePath(gamePath)))
      throw new Error(t("errors.path.game.notGame", { path: gamePath }));
    if (!(await commands.isPathValid(modsPath)))
      throw new Error(t("errors.path.mods.invalid", { path: modsPath }));
    if (!(await commands.isDirectory(modsPath)))
      throw new Error(t("errors.path.mods.missing", { path: modsPath }));
    return { modsPath, gamePath };
  };

  const migrateMods = async () => {
    let unlisten: UnlistenFn | undefined = undefined;
    const loadingModalState = loadingModal();
    try {
      const { modsPath, gamePath } = await getValidatedPaths();

      const iniPath = useProfilesStore.getState().getIniPath();
      const iniPrefix = useProfilesStore.getState().getIniPrefix();
      if (!iniPath || !iniPrefix)
        throw new Error("iniPath and iniPrefix are required");

      loadingModalState.open({
        label: t("mods.progress.migration.migratingMods"),
        progress: 0,
      });

      // Listen to progress events:
      // TODO: Perhaps, replace arbitrary percentages with actual percentages?
      // Arbitrary percentages:
      // - Remove bundled archives:  0% -  10%
      // - Removing mod:            10% -  50%
      // - Migrating mod:           50% -  90%
      // - Clean up:                90% - 100%
      unlisten = await events.modsMigrationProgress.listen((event) => {
        switch (event.payload.status) {
          case "removing-bundled-archives":
            loadingModalState.update({
              label: t("mods.progress.migration.removingBundledArchives"),
              progress: 0,
            });
            break;
          case "removing-mod":
            loadingModalState.update({
              label: t("mods.progress.migration.removingMod", {
                modTitle: event.payload.modTitle,
                count: event.payload.currentMod + 1,
                total: event.payload.totalMods,
              }),
              progress:
                10 + (event.payload.currentMod / event.payload.totalMods) * 40,
            });
            break;
          case "migrating-mod":
            loadingModalState.update({
              label: t("mods.progress.migration.migratingMod", {
                modTitle: event.payload.modTitle,
                count: event.payload.currentMod + 1,
                total: event.payload.totalMods,
              }),
              progress:
                50 + (event.payload.currentMod / event.payload.totalMods) * 40,
            });
            break;
          case "cleanup":
            loadingModalState.update({
              label: t("mods.progress.migration.cleanup"),
              progress: 90,
            });
            break;
        }
      });

      await Mods.legacy.migrateMods(gamePath, modsPath);
      await commands.iniSave(iniPath, iniPrefix, true);

      if (options.onSuccess) options.onSuccess();
    } catch (error) {
      if (options.onError) options.onError(error as AnyError);
    } finally {
      if (unlisten) unlisten();
      await loadingModalState.close();
    }
  };

  const deleteMods = async () => {
    let unlisten: UnlistenFn | undefined = undefined;
    const loadingModalState = loadingModal();
    try {
      const { modsPath, gamePath } = await getValidatedPaths();

      const iniPath = useProfilesStore.getState().getIniPath();
      const iniPrefix = useProfilesStore.getState().getIniPrefix();
      if (!iniPath || !iniPrefix)
        throw new Error("iniPath and iniPrefix are required");

      loadingModalState.open({
        label: t("mods.progress.deletion.removingMods"),
        progress: 0,
      });

      // Listen to progress events:
      // TODO: Perhaps, replace arbitrary percentages with actual percentages?
      // Arbitrary percentages:
      // - Remove bundled archives:  0% -  20%
      // - Removing mod:            20% -  80%
      // - Clean up:                80% - 100%
      unlisten = await events.modsMigrationProgress.listen((event) => {
        switch (event.payload.status) {
          case "removing-bundled-archives":
            loadingModalState.update({
              label: t("mods.progress.deletion.removingBundledArchives"),
              progress: 0,
            });
            break;
          case "removing-mod":
            loadingModalState.update({
              label: t("mods.progress.deletion.removingMod", {
                modTitle: event.payload.modTitle,
                count: event.payload.currentMod + 1,
                total: event.payload.totalMods,
              }),
              progress:
                20 + (event.payload.currentMod / event.payload.totalMods) * 60,
            });
            break;
          case "migrating-mod":
            // Unused: Doesn't get send when only deleting.
            break;
          case "cleanup":
            loadingModalState.update({
              label: t("mods.progress.deletion.cleanup"),
              progress: 80,
            });
            break;
        }
      });

      await Mods.legacy.removeMods(gamePath, modsPath);
      await commands.iniSave(iniPath, iniPrefix, true);

      if (options.onSuccess) options.onSuccess();
    } catch (error) {
      if (options.onError) options.onError(error as AnyError);
    } finally {
      if (unlisten) unlisten();
      await loadingModalState.close();
    }
  };

  return {
    migrateMods,
    deleteMods,
  };
}
