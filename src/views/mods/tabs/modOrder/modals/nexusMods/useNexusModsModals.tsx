import { AnyError, commandErrorToString } from "@/commands/errors";
import NexusMods from "@/commands/nexusmods";
import { messageModal, openModal } from "@/hooks/useModal";
import { modsEventBus } from "@/services/mods";
import * as nexusmodsApi from "@/services/nexusmods";
import { useModsStore } from "@/stores/mods";
import {
  nexusmodsStoreAccountSync,
  useNexusModsStore,
} from "@/stores/nexusmods";
import { useEffect } from "react";
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

  async function checkApiKey() {
    const apiKey = useNexusModsStore.getState().apiKey;

    // Is API key loaded?
    if (apiKey) return true;

    // If not, load account info:
    await nexusmodsStoreAccountSync.load();

    // Is the API key loaded now?
    const currentApiKey = useNexusModsStore.getState().apiKey;
    if (currentApiKey) return true;

    // If not, show a message to the user that they have to login:
    void showLoggedOutModal();
    return false;
  }

  async function retrieveModInfo(key: string) {
    if (!(await checkApiKey())) return;
    const mod = getMod(key);
    if (!mod) {
      modsEventBus.emitProgressAborted(
        t("mods.modOrderTab.progress.modNotFound"),
      );
      return;
    }
    await nexusmodsApi.retrieveModinfo(mod.url, mod.nexusFileId);
  }

  async function endorse(key: string) {
    if (!(await checkApiKey())) return;
    const mod = getMod(key);
    if (!mod) {
      modsEventBus.emitProgressAborted(
        t("mods.modOrderTab.progress.modNotFound"),
      );
      return;
    }
    await nexusmodsApi.endorse(mod.url, mod.version);
  }

  async function abstain(key: string) {
    if (!(await checkApiKey())) return;
    const mod = getMod(key);
    if (!mod) {
      modsEventBus.emitProgressAborted(
        t("mods.modOrderTab.progress.modNotFound"),
      );
      return;
    }
    await nexusmodsApi.abstain(mod.url, mod.version);
  }

  async function retrieveModInfoAll() {
    if (!(await checkApiKey())) throw new Error("API key is not set");
    const mods = useModsStore.getState().mods;
    await nexusmodsApi.retrieveModInfoAll(mods);
  }

  async function endorseAll() {
    if (!(await checkApiKey())) return;
    const mods = useModsStore.getState().mods;
    await nexusmodsApi.endorseAll(mods);
  }

  async function trackModFile(key: string) {
    if (!(await checkApiKey())) return;
    const mod = getMod(key);
    if (!mod) {
      modsEventBus.emitProgressAborted(
        t("mods.modOrderTab.progress.modNotFound"),
      );
      return;
    }
    try {
      const { gameDomain, gameScopedId, modFiles } =
        await nexusmodsApi.listModFiles(mod.url);
      const state: TrackModFileState = {
        key,
        gameDomain,
        gameScopedId,
        modFiles,
      };
      await openModal(TrackModFileModal, state);
    } catch (error) {
      console.error(
        `Failed to list mod files for mod '${mod.title}': ${commandErrorToString(error as AnyError)}`,
      );
    }
  }

  async function checkForUpdates() {
    await retrieveModInfoAll();
    const outdatedMods: OutdatedMod[] = [];
    const mods = useModsStore.getState().mods;
    for (const mod of mods) {
      let gameDomain, gameScopedId;
      try {
        [gameDomain, gameScopedId] = await NexusMods.extractIdsFromUrl(mod.url);
      } catch (error) {
        // If a single mod has an invalid URL, don't stop here. Log and move on:
        console.warn(
          `Couldn't extract IDs from URL: '${mod.url}'\n${commandErrorToString(error as AnyError)}`,
        );
        continue;
      }
      const latestVersion = getLatestVersion({
        gameDomain,
        gameScopedId,
        fileId: mod.nexusFileId,
      });
      if (isModOutdated(mod) && latestVersion != undefined) {
        outdatedMods.push({
          key: mod.key,
          title: mod.title,
          gameDomain,
          gameScopedId,
          currentVersion: mod.version,
          latestVersion,
        });
      }
    }
    await openModal(OutdatedModsModal, { outdatedMods });
  }

  // React to messages:
  useEffect(
    () =>
      modsEventBus.onUIActionEvent((message) => {
        switch (message.type) {
          case "nexus-mods-check-for-updates":
            checkForUpdates().catch(console.error);
            break;
          case "nexus-mods-download-mods-info":
            retrieveModInfoAll().catch(console.error);
            break;
          case "nexus-mods-endorse-all-mods":
            endorseAll().catch(console.error);
            break;
          case "nexus-mods-download-mod-info":
            retrieveModInfo(message.key).catch(console.error);
            break;
          case "nexus-mods-endorse-mod":
            endorse(message.key).catch(console.error);
            break;
          case "nexus-mods-abstain-mod":
            abstain(message.key).catch(console.error);
            break;
          case "nexus-mods-not-logged-in":
            showLoggedOutModal().catch(console.error);
            break;
          case "nexus-mods-track-mod-file":
            trackModFile(message.key).catch(console.error);
            break;
          // no default
        }
      }),
    [],
  );
}
