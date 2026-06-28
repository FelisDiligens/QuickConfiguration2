import { getFileSize } from "@/commands/additions";
import { commands } from "@/commands/bindings";
import Mods from "@/commands/mods";
import { useModsStore } from "@/stores/mods";
import { useProfilesStore } from "@/stores/profiles";
import { useResourceListStore } from "@/stores/resourceList";
import * as path from "@tauri-apps/api/path";
import _ from "lodash";
import { useEffect, useState } from "react";
import ResourceTable from "./ResourceTable";
import ToolRow from "./ToolRow";
import ResourceListModals from "./modals/ResourceListModals";

export interface Resource {
  name: string;
  modName: string;
  fileSize: number;
  exists: boolean;
}

export default function ResourceListTab() {
  const resources = useResourceListStore((store) => store.resources);
  const setResources = useResourceListStore((store) => store.setResources);

  const [mappedResources, setMappedResources] = useState<Resource[]>([]);
  useEffect(() => {
    const mapResources = async () => {
      // Get current state from stores:
      const state = useModsStore.getState().state;
      const dataPath = useProfilesStore.getState().getGameDataPath();

      // Get deployed resources from mods:
      const deployedResources = await Mods.utils.getDeployedArchives(state);

      // Supplement resources with additional information:
      const mappedResources: Resource[] = [];
      for (const resourceName of resources) {
        // Construct full path:
        const resourcePath = dataPath
          ? await path.join(dataPath, resourceName)
          : undefined;

        // Check if the file exists:
        const exists =
          dataPath && resourcePath
            ? await commands.isFile(resourcePath)
            : false;

        // If it exists, get it's file size:
        const fileSize =
          exists && resourcePath ? await getFileSize(resourcePath) : 0;

        // Determine which mod the resource belongs to (if at all):
        const modKey = deployedResources.find(
          (r) => r.archiveName === resourceName,
        )?.modId;
        const mod = modKey ? useModsStore.getState().getMod(modKey) : undefined;

        mappedResources.push({
          name: resourceName,
          modName: mod?.title || "-/-",
          fileSize,
          exists,
        });
      }
      setMappedResources(mappedResources);
    };

    // When dragging and dropping, we don't really want to call the expensive `mapResources` function.
    // Let's determine if the two arrays are identical (except for the metadata ofc):
    const alreadyMapped =
      resources.length == mappedResources.length &&
      _.zip(resources, mappedResources).find(
        ([resource, mappedResource]) => resource !== mappedResource?.name,
      ) === undefined;

    if (!alreadyMapped) {
      mapResources().catch((error) => {
        console.error(error);
        // Fallback:
        setMappedResources(
          resources.map((resource) => ({
            name: resource,
            modName: "",
            fileSize: 0,
            exists: false,
          })),
        );
      });
    }
  }, [resources]);

  return (
    <>
      <ToolRow />
      <ResourceTable
        resources={mappedResources}
        setResources={(value) => {
          // This function is really only called by useDragAndDrop.
          // We can assume that the metadata doesn't change in between the reordering:
          const newMappedResources =
            typeof value === "function" ? value(mappedResources) : value;
          const newResources = newMappedResources.map(
            (mappedResource) => mappedResource.name,
          );
          setMappedResources(newMappedResources);
          setResources(newResources);
        }}
      />
      <ResourceListModals />
    </>
  );
}
