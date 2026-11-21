import { confirmModal, openModal } from "@/hooks/useModal";
import { useResourceListActions } from "@/hooks/mods/useResourceListActions";
import { modsEventBus } from "@/services/mods";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import AddResourceModal from "./AddResourceModal";

export function useResourceListModals() {
  const { t } = useTranslation();
  const {
    addArchive,
    removeArchive,
    addUnlistedArchives,
    removeNonExistantArchives,
    removeGameArchives,
  } = useResourceListActions();

  const showAddArchiveModal = async () => {
    const name = await openModal(AddResourceModal, undefined);
    if (name) addArchive(name);
  };

  const confirmRemoveArchive = async (name: string) => {
    const confirmed = await confirmModal({
      title: t("mods.resourceListTab.modals.removeArchiveTitle"),
      children: t("mods.resourceListTab.modals.removeArchiveText", {
        archive: name,
      }),
    });
    if (confirmed) removeArchive(name);
  };

  // React to messages:
  useEffect(
    () =>
      modsEventBus.onUIActionEvent((message) => {
        switch (message.type) {
          case "resourcelist-add-archive":
            showAddArchiveModal().catch(console.error);
            break;
          case "resourcelist-add-unlisted-archives":
            addUnlistedArchives().catch(console.error);
            break;
          case "resourcelist-remove-non-existant-archives":
            removeNonExistantArchives().catch(console.error);
            break;
          case "resourcelist-remove-game-archives":
            removeGameArchives().catch(console.error);
            break;
          case "resourcelist-remove-archive":
            confirmRemoveArchive(message.name).catch(console.error);
            break;
          // no default
        }
      }),
    [],
  );
}
