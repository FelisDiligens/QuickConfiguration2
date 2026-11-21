import { AnyError, commandErrorToString } from "@/commands/errors";
import Mods from "@/commands/mods";
import { confirmModal } from "@/hooks/useModal";
import { modsEventBus } from "@/services/mods";
import { updateModsStore, useModsStore } from "@/stores/mods";
import { useProfilesStore } from "@/stores/profiles";
import { useToastsStore } from "@/stores/toasts";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export function useModManagement() {
  const { t } = useTranslation();
  const getMod = useModsStore((store) => store.getMod);

  const uninstallMod = async (key: string) => {
    try {
      const modsPath = useProfilesStore.getState().getModsPath();
      if (!modsPath) throw new Error(t("mods.errors.unsetModsPath"));

      const managedMods = useModsStore.getState().getManagedMods();
      const modTitle = useModsStore.getState().getMod(key)?.title || key;

      modsEventBus.emitProgressUpdated(
        t("mods.modOrderTab.progress.deletingMod"),
      );

      const update = await Mods.actions.mod.uninstall(
        managedMods,
        modsPath,
        key,
      );
      updateModsStore(update);

      modsEventBus.emitProgressFinished();
      useToastsStore
        .getState()
        .addToast(t("mods.modOrderTab.toasts.modDeleted"), modTitle);
    } catch (error) {
      modsEventBus.emitProgressAborted(error as AnyError);
      useToastsStore
        .getState()
        .addToast(
          t("mods.modOrderTab.toasts.modDeletedFailed"),
          t("common.error") + ": " + commandErrorToString(error as AnyError),
          "danger",
        );
    }
  };

  const deleteMod = async (key: string) => {
    const mod = getMod(key);
    if (!mod) return;
    const confirmed = await confirmModal({
      title: t("mods.modOrderTab.modals.deleteModTitle"),
      children: t("mods.modOrderTab.modals.deleteModText", {
        mod: mod.title || "",
      }),
    });
    if (confirmed) await uninstallMod(key);
  };

  // React to messages:
  useEffect(
    () =>
      modsEventBus.onUIActionEvent((message) => {
        switch (message.type) {
          case "mods-delete-mod":
            deleteMod(message.key).catch((reason) => {
              console.error(reason);
              modsEventBus.emitProgressAborted(reason as AnyError);
            });
            break;
          // no default
        }
      }),
    [],
  );

  return { deleteMod };
}
