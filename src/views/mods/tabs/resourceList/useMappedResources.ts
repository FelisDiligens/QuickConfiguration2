import { getFileSize } from "@/commands/additions";
import { commands } from "@/commands/bindings";
import type { ManagedMod, ModInstallationState } from "@/commands/bindings";
import Mods from "@/commands/mods";
import { useModsStore } from "@/stores/mods";
import { useProfilesStore } from "@/stores/profiles";
import { useResourceListStore } from "@/stores/resourceList";
import * as path from "@tauri-apps/api/path";
import fastDeepEqual from "fast-deep-equal/es6";
import _ from "lodash";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export interface Resource {
  name: string;
  modName: string;
  fileSize: number;
  exists: boolean;
}

/** Inputs (besides the resource names) that the mapped resources are derived from. */
interface MappingInputs {
  mods: ManagedMod[];
  modState: ModInstallationState[];
  dataPath: string | undefined;
}

/**
 * Maps the resource list (archive names) to `Resource` objects, supplementing
 * them with file size, existence and the title of the mod that deploys them.
 *
 * Re-maps whenever the resources change, but also whenever the mods store or
 * the game data path change (e.g. after importing or deploying a mod), since
 * the mod names are derived from the deployment state.
 */
export function useMappedResources() {
  const resources = useResourceListStore((store) => store.resources);
  const setResources = useResourceListStore((store) => store.setResources);
  const mods = useModsStore((store) => store.mods);
  const modState = useModsStore((store) => store.state);
  const dataPath = useProfilesStore((store) => store.getGameDataPath());

  const [mappedResources, setMappedResourcesState] = useState<Resource[]>([]);
  const lastInputsRef = useRef<MappingInputs | undefined>(undefined);

  useEffect(() => {
    const inputs: MappingInputs = { mods, modState, dataPath };

    // When dragging and dropping, we don't really want to call the expensive `mapResources` function.
    // Let's determine if the two arrays are identical (except for the metadata ofc):
    const namesMatch =
      resources.length === mappedResources.length &&
      _.zip(resources, mappedResources).find(
        ([resource, mappedResource]) => resource !== mappedResource?.name,
      ) === undefined;
    // Also skip re-mapping if the inputs the mapping was derived from haven't changed
    // (e.g. after deploying, when the resource list is set again with identical names):
    const alreadyMapped =
      namesMatch && fastDeepEqual(lastInputsRef.current, inputs);
    if (alreadyMapped) return;

    let cancelled = false;
    lastInputsRef.current = inputs;

    const mapResources = async () => {
      // Get deployed resources from mods:
      const deployedResources = await Mods.utils.getDeployedArchives(modState);

      // Supplement resources with additional information:
      const mapped: Resource[] = [];
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
        const mod = modKey ? mods.find((m) => m.key === modKey) : undefined;

        mapped.push({
          name: resourceName,
          modName: mod?.title || "-/-",
          fileSize,
          exists,
        });
      }
      return mapped;
    };

    mapResources()
      .then((mapped) => {
        if (!cancelled) setMappedResourcesState(mapped);
      })
      .catch((error) => {
        console.error(error);
        // Fallback:
        if (!cancelled) {
          setMappedResourcesState(
            resources.map((resource) => ({
              name: resource,
              modName: "",
              fileSize: 0,
              exists: false,
            })),
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [resources, mods, modState, dataPath, mappedResources]);

  const setMappedResources = useCallback<Dispatch<SetStateAction<Resource[]>>>(
    (value) => {
      // This function is really only called by useDragAndDrop.
      // We can assume that the metadata doesn't change in between the reordering:
      const newMappedResources =
        typeof value === "function" ? value(mappedResources) : value;
      setMappedResourcesState(newMappedResources);
      setResources(
        newMappedResources.map((mappedResource) => mappedResource.name),
      );
    },
    [mappedResources, setResources],
  );

  return { mappedResources, setMappedResources };
}
