import { AnyError } from "@/commands/errors";
import NexusMods from "@/commands/nexusmods";
import {
  errorModal,
  loadingModal,
  messageModal,
  openModal,
} from "@/hooks/useModal";
import * as nexusmodsApi from "@/services/nexusmods";
import { useModsStore } from "@/stores/mods";
import {
  nexusmodsStoreAccountSync,
  useNexusModsStore,
} from "@/stores/nexusmods";
import { useToastsStore } from "@/stores/toasts";
import { parseNexusModsUrl } from "@/utils/nexusmods";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import OutdatedModsModal from "./OutdatedModsModal";
import TrackModFileModal from "./TrackModFileModal";
import type { OutdatedMod, TrackModFileState } from "./types";

export function useNexusModsModals() {
  const { t } = useTranslation();
  const getLatestVersion = useNexusModsStore((store) => store.getLatestVersion);
  const isModOutdated = useNexusModsStore((store) => store.isModOutdated);
  const getMod = useModsStore((store) => store.getMod);

  async function showLoggedOutModal() {
    await messageModal({
      title: t("mods.modOrderTab.modals.loggedOutModal.title"),
      children: (
        <p>
          <Trans
            t={t}
            i18nKey="mods.modOrderTab.modals.loggedOutModal.message"
            components={{ a: <Link to="/nexusmods" /> }}
          />
        </p>
      ),
    });
  }

  async function loadApiKey() {
    // Is API key loaded?
    const apiKey = useNexusModsStore.getState().apiKey;
    if (apiKey) return apiKey;

    // If not, load account info:
    await nexusmodsStoreAccountSync.load();

    // Is the API key loaded now?
    const currentApiKey = useNexusModsStore.getState().apiKey;
    if (currentApiKey) return currentApiKey;

    return undefined;
  }

  async function checkApiKey() {
    // Get API key from store or load from file:
    const apiKey = await loadApiKey();
    if (apiKey) return true;

    // If not, show a message to the user that they have to login:
    void showLoggedOutModal();
    return false;
  }

  async function retrieveModInfo(key: string) {
    if (!(await checkApiKey())) return;

    const loadingModalState = loadingModal();
    try {
      const mod = getMod(key);
      if (!mod) throw new Error(t("mods.modOrderTab.progress.modNotFound"));

      const apiKey = useNexusModsStore.getState().apiKey;
      if (!apiKey) throw new Error("API key is not set");

      const ids = parseNexusModsUrl(mod.url);
      if (!ids) throw new Error("URL could not be parsed");

      loadingModalState.open({
        label: t("mods.modOrderTab.progress.retrievingModInfo"),
      });

      console.log("Retrieving mod info for", mod.url);
      await nexusmodsApi.retrieveModinfo(
        apiKey,
        ids.gameDomain,
        ids.gameScopedId,
        mod.nexusFileId,
      );

      useToastsStore
        .getState()
        .addToast(t("mods.modOrderTab.toasts.infoRetrieved"), "", "success");
    } catch (error) {
      console.error(error);
      void errorModal({ reason: error as AnyError });
    } finally {
      await loadingModalState.close();
    }
  }

  async function endorse(key: string) {
    if (!(await checkApiKey())) return;

    const loadingModalState = loadingModal();
    try {
      const mod = getMod(key);
      if (!mod) throw new Error(t("mods.modOrderTab.progress.modNotFound"));

      const apiKey = useNexusModsStore.getState().apiKey;
      if (!apiKey) throw new Error("API key is not set");

      const ids = parseNexusModsUrl(mod.url);
      if (!ids) throw new Error("URL could not be parsed");

      loadingModalState.open({
        label: t("mods.modOrderTab.progress.endorsingMod"),
      });

      console.log("Endorsing mod:", mod.url, mod.version);
      await nexusmodsApi.endorse(
        apiKey,
        ids.gameDomain,
        ids.gameScopedId,
        mod.version,
      );
    } catch (error) {
      console.error(error);
      void errorModal({ reason: error as AnyError });
    } finally {
      await loadingModalState.close();
    }
  }

  async function abstain(key: string) {
    if (!(await checkApiKey())) return;

    const loadingModalState = loadingModal();
    try {
      const mod = getMod(key);
      if (!mod) throw new Error(t("mods.modOrderTab.progress.modNotFound"));

      const apiKey = useNexusModsStore.getState().apiKey;
      if (!apiKey) throw new Error("API key is not set");

      const ids = parseNexusModsUrl(mod.url);
      if (!ids) throw new Error("URL could not be parsed");

      loadingModalState.open({
        label: t("mods.modOrderTab.progress.abstainingFromEndorsingMod"),
      });

      console.log("Abstaining from endorsing mod:", mod.url, mod.version);
      await nexusmodsApi.abstain(
        apiKey,
        ids.gameDomain,
        ids.gameScopedId,
        mod.version,
      );
    } catch (error) {
      console.error(error);
      void errorModal({ reason: error as AnyError });
    } finally {
      await loadingModalState.close();
    }
  }

  async function retrieveModInfoAll() {
    if (!(await checkApiKey())) return false;

    const loadingModalState = loadingModal();
    try {
      const mods = useModsStore.getState().mods;
      if (mods.length === 0) {
        useToastsStore
          .getState()
          .addToast(
            t("mods.modOrderTab.toasts.noModsToRetrieveInfo"),
            "",
            "secondary",
          );
        return false;
      }

      const apiKey = useNexusModsStore.getState().apiKey;
      if (!apiKey) throw new Error("API key is not set");

      const { retrievedCount } = await nexusmodsApi.retrieveModInfoAll(
        apiKey,
        mods,
        (data) => loadingModalState.update(data),
      );

      useToastsStore.getState().addToast(
        t("mods.modOrderTab.toasts.infoRetrievedWithCount", {
          count: retrievedCount,
        }),
        "",
        "success",
      );
      return true;
    } catch (error) {
      console.error(error);
      void errorModal({ reason: error as AnyError });
      return false;
    } finally {
      await loadingModalState.close();
    }
  }

  async function endorseAll() {
    if (!(await checkApiKey())) return;

    const loadingModalState = loadingModal();
    try {
      const mods = useModsStore.getState().mods;
      if (mods.length === 0) return false;

      const apiKey = useNexusModsStore.getState().apiKey;
      if (!apiKey) throw new Error("API key is not set");

      const { endorsedCount } = await nexusmodsApi.endorseAll(
        apiKey,
        mods,
        (data) => loadingModalState.update(data),
      );

      useToastsStore
        .getState()
        .addToast(
          t("mods.modOrderTab.toasts.modsEndorsed", { count: endorsedCount }),
          "",
          "success",
        );
    } catch (error) {
      console.error(error);
      void errorModal({ reason: error as AnyError });
      return false;
    } finally {
      await loadingModalState.close();
    }
  }

  async function trackModFile(key: string) {
    if (!(await checkApiKey())) return;

    const loadingModalState = loadingModal();
    try {
      const mod = getMod(key);
      if (!mod) throw new Error(t("mods.modOrderTab.progress.modNotFound"));

      const apiKey = useNexusModsStore.getState().apiKey;
      if (!apiKey) throw new Error("API key is not set");

      const ids = parseNexusModsUrl(mod.url);
      if (!ids) throw new Error("URL could not be parsed");

      loadingModalState.open({
        label: t("mods.modOrderTab.progress.listingModFiles"),
      });

      console.log("Listing mod files for", mod.url);
      const modFiles = await NexusMods.api.listModFiles(
        apiKey,
        ids.gameDomain,
        ids.gameScopedId,
        null,
      );

      const state: TrackModFileState = {
        key,
        gameDomain: ids.gameDomain,
        gameScopedId: ids.gameScopedId,
        modFiles,
      };

      await loadingModalState.close();
      const file = await openModal(TrackModFileModal, state);
      if (!file) return;

      const modfile = await NexusMods.api.getModFileInfoFromModFiles(
        ids.gameDomain,
        ids.gameScopedId,
        file.fileId,
        modFiles,
      );
      useNexusModsStore.getState().addOrUpdateModfile(modfile);

      useModsStore
        .getState()
        .setMod(key, (mod) => ({ ...mod, nexusFileId: file.fileId }));

      useToastsStore
        .getState()
        .addToast(
          t("mods.modOrderTab.toasts.fileTracked"),
          modfile.name,
          "success",
        );
    } catch (error) {
      console.error(error);
      void errorModal({ reason: error as AnyError });
    } finally {
      await loadingModalState.close();
    }
  }

  async function checkForUpdates() {
    if (!(await retrieveModInfoAll())) return;

    const outdatedMods: OutdatedMod[] = [];
    const mods = useModsStore.getState().mods;
    for (const mod of mods) {
      const ids = parseNexusModsUrl(mod.url);
      if (!ids) {
        // If a single mod has an invalid URL, don't stop here. Log and move on:
        console.warn(`Couldn't extract IDs from URL: '${mod.url}'`);
        continue;
      }

      const latestVersion = getLatestVersion({
        gameDomain: ids.gameDomain,
        gameScopedId: ids.gameScopedId,
        fileId: mod.nexusFileId,
      });
      if (isModOutdated(mod) && latestVersion != undefined) {
        outdatedMods.push({
          key: mod.key,
          title: mod.title,
          gameDomain: ids.gameDomain,
          gameScopedId: ids.gameScopedId,
          currentVersion: mod.version,
          latestVersion,
        });
      }
    }
    await openModal(OutdatedModsModal, { outdatedMods });
  }

  return {
    checkForUpdates,
    retrieveModInfoAll,
    endorseAll,
    retrieveModInfo,
    endorse,
    abstain,
    showLoggedOutModal,
    trackModFile,
  };
}
