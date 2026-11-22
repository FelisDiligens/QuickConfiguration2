import { AnyError, commandErrorToString } from "@/commands/errors";
import Mods from "@/commands/mods";
import { confirmModal, openModal } from "@/hooks/useModal";
import { modsEventBus } from "@/services/mods";
import { useProfilesStore } from "@/stores/profiles";
import { useResourceListStore } from "@/stores/resourceList";
import { useToastsStore } from "@/stores/toasts";
import _ from "lodash";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import AddResourceModal from "./AddResourceModal";

export function useResourceListModals() {
  const { t } = useTranslation();
  const setResources = useResourceListStore((store) => store.setResources);
  const addResource = useResourceListStore((store) => store.addResource);
  const removeResource = useResourceListStore((store) => store.removeResource);

  const addArchive = async () => {
    const name = await openModal(AddResourceModal, undefined);
    if (name) {
      console.log(`Added archive: ${name}`);
      addResource(name);
    }
  };

  const removeArchive = async (name: string) => {
    const confirmed = await confirmModal({
      title: t("mods.resourceListTab.modals.removeArchiveTitle"),
      children: t("mods.resourceListTab.modals.removeArchiveText", {
        archive: name,
      }),
    });
    if (confirmed) {
      console.log(`Removed archive: ${name}`);
      removeResource(name);
    }
  };

  const addUnlistedArchives = async () => {
    try {
      const resources = useResourceListStore.getState().resources;
      const gamePath = useProfilesStore.getState().getGamePath();
      if (!gamePath) throw new Error(t("mods.errors.unsetGamePath"));

      const newResources = await Mods.resourceList.addUnlistedArchives(
        resources,
        gamePath,
      );
      setResources(newResources);

      useToastsStore.getState().addToast(
        t("mods.resourceListTab.toasts.addedUnlistedArchives"),
        t("mods.resourceListTab.toasts.addedUnlistedArchivesText", {
          count: _.difference(newResources, resources).length,
        }),
        "success",
      );
    } catch (error) {
      useToastsStore
        .getState()
        .addToast(
          t("errors.anErrorOccurred"),
          t("common.error") + ": " + commandErrorToString(error as AnyError),
          "danger",
        );
    }
  };

  const removeNonExistantArchives = async () => {
    try {
      const resources = useResourceListStore.getState().resources;
      const gamePath = useProfilesStore.getState().getGamePath();
      if (!gamePath) throw new Error(t("mods.errors.unsetGamePath"));

      const newResources = await Mods.resourceList.removeNonExistantArchives(
        resources,
        gamePath,
      );
      setResources(newResources);

      useToastsStore.getState().addToast(
        t("mods.resourceListTab.toasts.removedNonExistantArchives"),
        t("mods.resourceListTab.toasts.removedNonExistantArchivesText", {
          count: _.difference(resources, newResources).length,
        }),
        "success",
      );
    } catch (error) {
      useToastsStore
        .getState()
        .addToast(
          t("errors.anErrorOccurred"),
          t("common.error") + ": " + commandErrorToString(error as AnyError),
          "danger",
        );
    }
  };

  const removeGameArchives = async () => {
    try {
      const resources = useResourceListStore.getState().resources;
      const newResources =
        await Mods.resourceList.removeGameArchives(resources);
      setResources(newResources);

      useToastsStore.getState().addToast(
        t("mods.resourceListTab.toasts.removedGameArchives"),
        t("mods.resourceListTab.toasts.removedGameArchivesText", {
          count: _.difference(resources, newResources).length,
        }),
        "success",
      );
    } catch (error) {
      useToastsStore
        .getState()
        .addToast(
          t("errors.anErrorOccurred"),
          t("common.error") + ": " + commandErrorToString(error as AnyError),
          "danger",
        );
    }
  };

  // React to messages:
  useEffect(
    () =>
      modsEventBus.onResourcesEvent((message) => {
        switch (message.type) {
          case "resourcelist-add-archive":
            addArchive().catch(console.error);
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
            removeArchive(message.name).catch(console.error);
            break;
        }
      }),
    [],
  );
}
