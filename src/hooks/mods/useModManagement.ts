import { ManagedMod } from "@/commands/bindings";
import { AnyError, commandErrorToString } from "@/commands/errors";
import Mods from "@/commands/mods";
import { modsEventBus } from "@/services/mods";
import { updateModsStore, useModsStore } from "@/stores/mods";
import { useProfilesStore } from "@/stores/profiles";
import { useToastsStore } from "@/stores/toasts";
import { useAtom } from "jotai";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { isModDeletionModalShownAtom } from "@/views/mods/tabs/modOrder/modals";

function useModDeletionModal() {
  const { t } = useTranslation();

  const [show, setShow] = useAtom(isModDeletionModalShownAtom);
  const getMod = useModsStore((store) => store.getMod);
  const [mod, setMod] = useState<ManagedMod | undefined>(undefined);

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

  return {
    deleteMod: (key: string) => {
      setShow(true);
      setMod(getMod(key));
    },
    modalProps: {
      mod,
      show,
      onConfirm: (key: string) => {
        setShow(false);
        uninstallMod(key).catch(console.error);
      },
      onAbort: () => {
        setShow(false);
      },
    },
  };
}

export function useModManagement() {
  const { deleteMod, modalProps: deleteModModalProps } = useModDeletionModal();
  return { deleteMod, deleteModModalProps };
}
