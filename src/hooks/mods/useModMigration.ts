import { commands, events } from "@/commands/bindings";
import { AnyError } from "@/commands/errors";
import Mods from "@/commands/mods";
import { useProfilesStore } from "@/stores/profiles";
import { UnlistenFn } from "@tauri-apps/api/event";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export function useModMigration(onSuccess?: () => void) {
  const { t } = useTranslation();

  const [isPending, setIsPending] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [progress, setProgress] = useState<number | undefined>(undefined);
  const [error, setError] = useState<AnyError>(null);

  const showProgress = (text: string, progress?: number) => {
    setIsPending(true);
    setStatusText(text);
    setProgress(progress);
  };

  const hideProgress = () => setIsPending(false);

  const showError = (error: AnyError) => {
    hideProgress();
    setError(error);
  };

  const migrateMods = async () => {
    let unlisten: UnlistenFn | undefined = undefined;
    try {
      const modsPath = useProfilesStore.getState().getModsPath();
      const gamePath = useProfilesStore.getState().getGamePath();
      if (!modsPath || !gamePath)
        throw new Error(t("mods.errors.unsetModsPathOrGamePath"));

      const iniPath = useProfilesStore.getState().getIniPath();
      const iniPrefix = useProfilesStore.getState().getIniPrefix();
      if (!iniPath || !iniPrefix)
        throw new Error("iniPath and iniPrefix are required");

      showProgress(t("mods.progress.migration.migratingMods"), 0);

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
            showProgress(
              t("mods.progress.migration.removingBundledArchives"),
              0,
            );
            break;
          case "removing-mod":
            showProgress(
              t("mods.progress.migration.removingMod", {
                modTitle: event.payload.modTitle,
                count: event.payload.currentMod + 1,
                total: event.payload.totalMods,
              }),
              10 + (event.payload.currentMod / event.payload.totalMods) * 40,
            );
            break;
          case "migrating-mod":
            showProgress(
              t("mods.progress.migration.migratingMod", {
                modTitle: event.payload.modTitle,
                count: event.payload.currentMod + 1,
                total: event.payload.totalMods,
              }),
              50 + (event.payload.currentMod / event.payload.totalMods) * 40,
            );
            break;
          case "cleanup":
            showProgress(t("mods.progress.migration.cleanup"), 90);
            break;
        }
      });

      await Mods.legacy.migrateMods(gamePath, modsPath);
      await commands.iniSave(iniPath, iniPrefix);

      hideProgress();
      if (onSuccess) onSuccess();
    } catch (error) {
      showError(error as AnyError);
    } finally {
      if (unlisten) unlisten();
    }
  };

  const deleteMods = async () => {
    let unlisten: UnlistenFn | undefined = undefined;
    try {
      const modsPath = useProfilesStore.getState().getModsPath();
      const gamePath = useProfilesStore.getState().getGamePath();
      if (!modsPath || !gamePath)
        throw new Error(t("mods.errors.unsetModsPathOrGamePath"));

      const iniPath = useProfilesStore.getState().getIniPath();
      const iniPrefix = useProfilesStore.getState().getIniPrefix();
      if (!iniPath || !iniPrefix)
        throw new Error("iniPath and iniPrefix are required");

      showProgress(t("mods.progress.deletion.removingMods"), 0);

      // Listen to progress events:
      // TODO: Perhaps, replace arbitrary percentages with actual percentages?
      // Arbitrary percentages:
      // - Remove bundled archives:  0% -  20%
      // - Removing mod:            20% -  80%
      // - Clean up:                80% - 100%
      unlisten = await events.modsMigrationProgress.listen((event) => {
        switch (event.payload.status) {
          case "removing-bundled-archives":
            showProgress(
              t("mods.progress.deletion.removingBundledArchives"),
              0,
            );
            break;
          case "removing-mod":
            showProgress(
              t("mods.progress.deletion.removingMod", {
                modTitle: event.payload.modTitle,
                count: event.payload.currentMod + 1,
                total: event.payload.totalMods,
              }),
              20 + (event.payload.currentMod / event.payload.totalMods) * 60,
            );
            break;
          case "migrating-mod":
            // Unused: Doesn't get send when only deleting.
            break;
          case "cleanup":
            showProgress(t("mods.progress.deletion.cleanup"), 80);
            break;
        }
      });

      await Mods.legacy.removeMods(gamePath, modsPath);
      await commands.iniSave(iniPath, iniPrefix);

      hideProgress();
      if (onSuccess) onSuccess();
    } catch (error) {
      showError(error as AnyError);
    } finally {
      if (unlisten) unlisten();
    }
  };

  return {
    isPending,
    error,
    statusText,
    progress,
    migrateMods,
    deleteMods,
  };
}
