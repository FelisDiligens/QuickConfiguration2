import { AnyError, commandErrorToString } from "@/commands/errors";
import Mods from "@/commands/mods";
import { useProfilesStore } from "@/stores/profiles";
import { useResourceListStore } from "@/stores/resourceList";
import { useToastsStore } from "@/stores/toasts";
import _ from "lodash";
import { useTranslation } from "react-i18next";

export function useResourceListActions() {
  const { t } = useTranslation();
  const setResources = useResourceListStore((store) => store.setResources);

  const addArchive = (name: string) => {
    console.log(`Added archive: ${name}`);
    setResources((resources) => _(resources).push(name).uniq().value());
  };

  const removeArchive = (name: string) => {
    console.log(`Removed archive: ${name}`);
    setResources((resources) =>
      resources.filter((resource) => resource !== name),
    );
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
        "", // TODO: Add details, e.g. how many new archives were added
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
        "", // TODO: Add details, e.g. how many archives were removed
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
        "", // TODO: Add details, e.g. how many archives were removed
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

  return {
    addArchive,
    removeArchive,
    addUnlistedArchives,
    removeNonExistantArchives,
    removeGameArchives,
  };
}
