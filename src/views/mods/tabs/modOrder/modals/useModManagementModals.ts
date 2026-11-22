import { AnyError, commandErrorToString } from "@/commands/errors";
import Mods from "@/commands/mods";
import { confirmModal, loadingModal } from "@/hooks/useModal";
import { updateModsStore, useModsStore } from "@/stores/mods";
import { useProfilesStore } from "@/stores/profiles";
import { useToastsStore } from "@/stores/toasts";
import { useTranslation } from "react-i18next";

export function useModManagementModals() {
  const { t } = useTranslation();
  const getMod = useModsStore((store) => store.getMod);

  const uninstallMod = async (key: string) => {
    const loadingModalState = loadingModal();
    try {
      const modsPath = useProfilesStore.getState().getModsPath();
      if (!modsPath) throw new Error(t("mods.errors.unsetModsPath"));

      const managedMods = useModsStore.getState().getManagedMods();
      const modTitle = useModsStore.getState().getMod(key)?.title || key;

      loadingModalState.open({
        label: t("mods.modOrderTab.progress.deletingMod"),
      });

      const update = await Mods.actions.mod.uninstall(
        managedMods,
        modsPath,
        key,
      );
      updateModsStore(update);

      useToastsStore
        .getState()
        .addToast(t("mods.modOrderTab.toasts.modDeleted"), modTitle);
    } catch (error) {
      console.error(error);
      useToastsStore
        .getState()
        .addToast(
          t("mods.modOrderTab.toasts.modDeletedFailed"),
          t("common.error") + ": " + commandErrorToString(error as AnyError),
          "danger",
        );
    } finally {
      await loadingModalState.close();
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

  return { deleteMod };
}
