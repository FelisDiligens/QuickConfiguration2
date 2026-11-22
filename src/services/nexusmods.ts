import { ManagedMod } from "@/commands/bindings";
import NexusMods from "@/commands/nexusmods";
import { LoadingModalData } from "@/components/modals/LoadingModal";
import { useNexusModsStore } from "@/stores/nexusmods";
import { Nullish } from "@/types";
import { parseNexusModsUrl } from "@/utils/nexusmods";
import { t } from "i18next";

/** Retrieve info for given mod */
export async function retrieveModinfo(
  apiKey: string,
  gameDomain: string,
  gameScopedId: number,
  fileId?: Nullish<number>,
) {
  // Retrieve info:
  const modinfo = await NexusMods.api.retrieveModinfo(
    apiKey,
    gameDomain,
    gameScopedId,
  );

  // Update store:
  useNexusModsStore.getState().addOrUpdateModinfo(modinfo);

  // Retrieve file info if file id is given:
  let modfile = undefined;
  if (fileId != undefined) {
    modfile = await NexusMods.api.getModFile(
      apiKey,
      gameDomain,
      gameScopedId,
      fileId,
    );

    // Update store:
    useNexusModsStore.getState().addOrUpdateModfile(modfile);
  }

  return { modinfo, modfile };
}

/** Endorse mod */
export async function endorse(
  apiKey: string,
  gameDomain: string,
  gameScopedId: number,
  modVersion: string,
) {
  if (!modVersion) throw new Error("Version string is empty");

  // Endorse mod:
  await NexusMods.api.endorse(apiKey, gameDomain, gameScopedId, modVersion);

  // Update status in store, assuming the API call was successful since it didn't throw an error:
  useNexusModsStore
    .getState()
    .setEndorseStatus({ gameDomain, gameScopedId }, "Endorsed");
}

/** Abstain from endorsing mod */
export async function abstain(
  apiKey: string,
  gameDomain: string,
  gameScopedId: number,
  modVersion: string,
) {
  if (!modVersion) throw new Error("Version string is empty");

  // Abstain mod:
  await NexusMods.api.abstain(apiKey, gameDomain, gameScopedId, modVersion);

  // Update status in store, assuming the API call was successful since it didn't throw an error:
  useNexusModsStore
    .getState()
    .setEndorseStatus({ gameDomain, gameScopedId }, "Abstained");
}

/** Retrieve info for all mods */
export async function retrieveModInfoAll(
  apiKey: string,
  mods: ManagedMod[],
  onUpdate?: (data: LoadingModalData) => void,
) {
  console.log(`Retrieving info for ${mods.length} mods.`);
  if (onUpdate)
    onUpdate({ label: t("mods.modOrderTab.progress.retrievingInfoForMods") });

  let retrievedCount = 0;
  for (const [i, mod] of mods.entries()) {
    // Emit progress:
    if (onUpdate)
      onUpdate({
        label: t("mods.modOrderTab.progress.retrievingInfoForModXofY", {
          currentMod: i + 1,
          totalMods: mods.length,
          modTitle: mod.title,
        }),
        progress: (i / mods.length) * 100,
      });

    // Skip mods without a URL:
    if (!mod.url) continue;

    // Extract IDs from the URL:
    const ids = parseNexusModsUrl(mod.url);
    if (!ids) {
      // If a single mod has an invalid URL, don't stop here. Log and move on:
      console.warn(
        `Couldn't retrieve infos for mod '${mod.title}'. Couldn't extract IDs from URL: '${mod.url}'`,
      );
      continue;
    }

    // Fail if any of the two API requests (general mod info and mod files) fails:
    await retrieveModinfo(
      apiKey,
      ids.gameDomain,
      ids.gameScopedId,
      mod.nexusFileId,
    );
    retrievedCount++;
  }
  return { retrievedCount };
}

/** Endorse all mods */
export async function endorseAll(
  apiKey: string,
  mods: ManagedMod[],
  onUpdate?: (data: LoadingModalData) => void,
) {
  console.log(`Retrieving info for ${mods.length} mods.`);
  if (onUpdate)
    onUpdate({ label: t("mods.modOrderTab.progress.retrievingInfoForMods") });

  let endorsedCount = 0;
  for (const [i, mod] of mods.entries()) {
    // Emit progress:
    if (onUpdate)
      onUpdate({
        label: t("mods.modOrderTab.progress.endorsingModXofY", {
          currentMod: i + 1,
          totalMods: mods.length,
          modTitle: mod.title,
        }),
        progress: (i / mods.length) * 100,
      });

    // Skip mods without a URL or version:
    if (!mod.url || !mod.version) continue;

    // Extract IDs from the URL:
    const ids = parseNexusModsUrl(mod.url);
    if (!ids) {
      // If a single mod has an invalid URL, don't stop here. Log and move on:
      console.warn(
        `Couldn't endorse mod '${mod.title}'. Couldn't extract IDs from URL: '${mod.url}'`,
      );
      continue;
    }

    // Endorse mod:
    await endorse(apiKey, ids.gameDomain, ids.gameScopedId, mod.version);

    endorsedCount++;
  }
  return { endorsedCount };
}
