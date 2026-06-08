import { ManagedMod } from "@/commands/bindings";
import { AnyError, commandErrorToString } from "@/commands/errors";
import NexusMods from "@/commands/nexusmods";
import { modsEventBus } from "@/services/mods";
import { useNexusModsStore } from "@/stores/nexusmods";
import { useToastsStore } from "@/stores/toasts";
import { t } from "i18next";

/** Retrieve info for given mod */
export async function retrieveModinfo(url: string) {
  try {
    const apiKey = useNexusModsStore.getState().apiKey;
    if (!apiKey) throw new Error("API key is not set");

    console.log("Retrieving mod info for", url);
    modsEventBus.emitProgressUpdated(
      t("mods.modOrderTab.progress.retrievingModInfo"),
    );

    // Retrieve info:
    const [gameDomain, gameScopedId] = await NexusMods.extractIdsFromUrl(url);
    const modinfo = await NexusMods.api.retrieveModinfo(
      apiKey,
      gameDomain,
      gameScopedId,
    );

    // Update store:
    useNexusModsStore.getState().addOrUpdateModinfo(modinfo);

    modsEventBus.emitProgressFinished();
    useToastsStore
      .getState()
      .addToast(t("mods.modOrderTab.toasts.infoRetrieved"), "", "success");

    return modinfo;
  } catch (error) {
    modsEventBus.emitProgressAborted(error as AnyError);
    throw error;
  }
}

/** Endorse mod */
export async function endorse(url: string, modVersion: string) {
  try {
    const apiKey = useNexusModsStore.getState().apiKey;
    if (!apiKey) throw new Error("API key is not set");
    if (!url || !modVersion) throw new Error("URL or version is empty");

    console.log("Endorsing mod:", url, modVersion);
    modsEventBus.emitProgressUpdated(
      t("mods.modOrderTab.progress.endorsingMod"),
    );

    // Endorse mod:
    const [gameDomain, gameScopedId] = await NexusMods.extractIdsFromUrl(url);
    await NexusMods.api.endorse(apiKey, gameDomain, gameScopedId, modVersion);

    // Update status in store, assuming the API call was successful since it didn't throw an error:
    useNexusModsStore
      .getState()
      .setEndorseStatus(gameDomain, gameScopedId, "Endorsed");

    modsEventBus.emitProgressFinished();
  } catch (error) {
    modsEventBus.emitProgressAborted(error as AnyError);
    throw error;
  }
}

/** Abstain from endorsing mod */
export async function abstain(url: string, modVersion: string) {
  try {
    const apiKey = useNexusModsStore.getState().apiKey;
    if (!apiKey) throw new Error("API key is not set");
    if (!url || !modVersion) throw new Error("URL or version is empty");

    console.log("Abstaining from endorsing mod:", url, modVersion);
    modsEventBus.emitProgressUpdated(
      t("mods.modOrderTab.progress.abstainingFromEndorsingMod"),
    );

    // Abstain mod:
    const [gameDomain, gameScopedId] = await NexusMods.extractIdsFromUrl(url);
    await NexusMods.api.abstain(apiKey, gameDomain, gameScopedId, modVersion);

    // Update status in store, assuming the API call was successful since it didn't throw an error:
    useNexusModsStore
      .getState()
      .setEndorseStatus(gameDomain, gameScopedId, "Abstained");

    modsEventBus.emitProgressFinished();
  } catch (error) {
    modsEventBus.emitProgressAborted(error as AnyError);
    throw error;
  }
}

/** Retrieve info for all mods */
export async function retrieveModInfoAll(mods: ManagedMod[]) {
  try {
    const apiKey = useNexusModsStore.getState().apiKey;
    if (!apiKey) throw new Error("API key is not set");

    console.log(`Retrieving info for ${mods.length} mods.`);
    modsEventBus.emitProgressUpdated(
      t("mods.modOrderTab.progress.retrievingInfoForMods"),
    );

    let retrievedCount = 0;
    for (const [i, mod] of mods.entries()) {
      // Emit progress:
      modsEventBus.emitProgressUpdated(
        t("mods.modOrderTab.progress.retrievingInfoForModXofY", {
          currentMod: i + 1,
          totalMods: mods.length,
          modTitle: mod.title,
        }),
        i / mods.length,
      );

      // Skip mods without a URL:
      if (!mod.url) continue;

      // Extract IDs from the URL:
      let gameDomain, gameScopedId;
      try {
        [gameDomain, gameScopedId] = await NexusMods.extractIdsFromUrl(mod.url);
      } catch (error) {
        // If a single mod has an invalid URL, don't stop here. Log and move on:
        console.warn(
          `Couldn't retrieve infos for mod '${mod.title}'. Couldn't extract IDs from URL: '${mod.url}'\n${commandErrorToString(error as AnyError)}`,
        );
        continue;
      }

      // Retrieve info for mod:
      const modinfo = await NexusMods.api.retrieveModinfo(
        apiKey,
        gameDomain,
        gameScopedId,
      );

      // Update store:
      useNexusModsStore.getState().addOrUpdateModinfo(modinfo);

      retrievedCount++;
    }

    modsEventBus.emitProgressFinished();
    useToastsStore.getState().addToast(
      t("mods.modOrderTab.toasts.infoRetrievedWithCount", {
        count: retrievedCount,
      }),
      "",
      "success",
    );
  } catch (error) {
    modsEventBus.emitProgressAborted(error as AnyError);
    throw error;
  }
}

/** Endorse all mods */
export async function endorseAll(mods: ManagedMod[]) {
  try {
    const apiKey = useNexusModsStore.getState().apiKey;
    if (!apiKey) throw new Error("API key is not set");

    console.log(`Retrieving info for ${mods.length} mods.`);
    modsEventBus.emitProgressUpdated(
      t("mods.modOrderTab.progress.retrievingInfoForMods"),
    );

    let endorsedCount = 0;
    for (const [i, mod] of mods.entries()) {
      // Emit progress:
      modsEventBus.emitProgressUpdated(
        t("mods.modOrderTab.progress.endorsingModXofY", {
          currentMod: i + 1,
          totalMods: mods.length,
          modTitle: mod.title,
        }),
        i / mods.length,
      );

      // Skip mods without a URL or version:
      if (!mod.url || !mod.version) continue;

      // Extract IDs from the URL:
      let gameDomain, gameScopedId;
      try {
        [gameDomain, gameScopedId] = await NexusMods.extractIdsFromUrl(mod.url);
      } catch (error) {
        // If a single mod has an invalid URL, don't stop here. Log and move on:
        console.warn(
          `Couldn't endorse mod '${mod.title}'. Couldn't extract IDs from URL: '${mod.url}'\n${commandErrorToString(error as AnyError)}`,
        );
        continue;
      }

      // Endorse mod:
      await NexusMods.api.endorse(
        apiKey,
        gameDomain,
        gameScopedId,
        mod.version,
      );

      // Update status in store, assuming the API call was successful since it didn't throw an error:
      useNexusModsStore
        .getState()
        .setEndorseStatus(gameDomain, gameScopedId, "Endorsed");

      endorsedCount++;
    }

    modsEventBus.emitProgressFinished();
    useToastsStore
      .getState()
      .addToast(
        t("mods.modOrderTab.toasts.modsEndorsed", { count: endorsedCount }),
        "",
        "success",
      );
  } catch (error) {
    modsEventBus.emitProgressAborted(error as AnyError);
    throw error;
  }
}
