import { AnyError, commandErrorToString } from "@/commands/errors";
import NexusMods from "@/commands/nexusmods";
import { modsEventBus } from "@/services/mods";
import * as nexusmodsApi from "@/services/nexusmods";
import { useModsStore } from "@/stores/mods";
import {
  nexusmodsStoreAccountSync,
  useNexusModsStore,
} from "@/stores/nexusmods";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { isLoggedOutModalShownAtom, isOutdatedModsModalShownAtom } from "..";
import LoggedOutModal from "./LoggedOutModal";
import OutdatedModsModal from "./OutdatedModsModal";

export interface OutdatedMod {
  key: string;
  title: string;
  gameDomain: string;
  gameScopedId: number;
  currentVersion: string;
  latestVersion: string;
}

export default function NexusModsModals() {
  const { t } = useTranslation();
  const getModinfo = useNexusModsStore((store) => store.getModinfo);
  const getMod = useModsStore((store) => store.getMod);

  const [showOutdatedModal, setShowOutdatedModal] = useAtom(
    isOutdatedModsModalShownAtom,
  );
  const [outdatedMods, setOutdatedMods] = useState<OutdatedMod[]>([]);
  const [showLoggedOutModal, setShowLoggedOutModal] = useAtom(
    isLoggedOutModalShownAtom,
  );

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
    setShowLoggedOutModal(true);
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
    await nexusmodsApi.retrieveModinfo(mod.url);
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

  async function checkForUpdates() {
    await retrieveModInfoAll();
    const outdatedMods = [];
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
      const modinfo = getModinfo(gameDomain, gameScopedId);
      if (!modinfo) continue;
      if (modinfo.version !== mod.version) {
        outdatedMods.push({
          key: mod.key,
          title: mod.title,
          gameDomain,
          gameScopedId,
          currentVersion: mod.version,
          latestVersion: modinfo.version,
        });
      }
    }
    setOutdatedMods(outdatedMods);
    setShowOutdatedModal(true);
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
            setShowLoggedOutModal(true);
            break;
          // no default
        }
      }),
    [],
  );

  return (
    <>
      <LoggedOutModal
        show={showLoggedOutModal}
        onHide={() => setShowLoggedOutModal(false)}
      />
      <OutdatedModsModal
        show={showOutdatedModal}
        onHide={() => setShowOutdatedModal(false)}
        outdatedMods={outdatedMods}
      />
    </>
  );
}
