import {
  commands,
  events,
  NexusModsDownloadLink,
  NexusModsModInfo,
} from "@/commands/bindings";
import { AnyError, commandErrorToString } from "@/commands/errors";
import NexusMods from "@/commands/nexusmods";
import { modsEventBus } from "@/services/mods";
import * as nexusmodsApi from "@/services/nexusmods";
import { nxmLinksQueueService } from "@/services/nxm";
import {
  nexusmodsStoreAccountSync,
  useNexusModsStore,
} from "@/stores/nexusmods";
import { useSettingsStore } from "@/stores/settings";
import { formatBytes } from "@/utils";
import { UnlistenFn } from "@tauri-apps/api/event";
import { useAtom, useAtomValue } from "jotai";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { isAnyModalShownAtom, isCdnModalShownAtom } from "..";
import ChooseCDNLinkModal from "./ChooseCDNLinkModal";

export default function ModDownloadModals() {
  const { t } = useTranslation();
  const [isCdnModalShown, setIsCdnModalShown] = useAtom(isCdnModalShownAtom);
  const isAnyModalShown = useAtomValue(isAnyModalShownAtom);
  const [cdnLinks, setCdnLinks] = useState<NexusModsDownloadLink[]>([]);
  const isPendingRef = useRef(false);
  const modLinkRef = useRef<string | undefined>(undefined);
  const modDetailsRef = useRef<NexusModsModInfo | undefined>(undefined);

  function showCdnModal(cdnLinks: NexusModsDownloadLink[]) {
    setIsCdnModalShown(true);
    setCdnLinks(cdnLinks);
  }

  function hideCdnModal() {
    setIsCdnModalShown(false);
    setCdnLinks([]);
  }

  async function checkApiKey() {
    // Is API key loaded?
    const apiKey = useNexusModsStore.getState().apiKey;
    if (apiKey) return true;

    // If not, load account info:
    await nexusmodsStoreAccountSync.load();

    // Is the API key loaded now?
    const currentApiKey = useNexusModsStore.getState().apiKey;
    if (currentApiKey) return true;

    // If not, show a message to the user that they have to login:
    modsEventBus.emitUIActionEvent({ type: "nexus-mods-not-logged-in" });
    return false;
  }

  const requestDownloadLinks = async (nxmLink: string) => {
    if (!(await checkApiKey())) return;
    isPendingRef.current = true;
    try {
      const apiKey = useNexusModsStore.getState().apiKey;
      if (!apiKey) throw new Error("API key not set");

      modsEventBus.emitProgressUpdated(
        t("mods.modOrderTab.progress.requestingCdnLinks"),
      );

      const nxmDetails = await NexusMods.extractDetailsFromNxmUrl(nxmLink);
      modLinkRef.current = `https://www.nexusmods.com/${nxmDetails.gameDomain}/mods/${nxmDetails.gameScopedId}`;
      const cdnLinks = await NexusMods.api.requestDownloadLinks(
        apiKey,
        nxmLink,
      );

      modsEventBus.emitProgressFinished();

      if (!cdnLinks || cdnLinks.length == 0) {
        throw new Error("Didn't get any CDN links from API");
      } else if (cdnLinks.length > 1) {
        showCdnModal(cdnLinks);
      } else {
        await downloadMod(cdnLinks[0].uri);
      }
    } catch (error) {
      modsEventBus.emitProgressAborted(error as AnyError);
      isPendingRef.current = false;
    }
  };

  const downloadMod = async (downloadLink: string) => {
    let unlisten: UnlistenFn | undefined = undefined;
    isPendingRef.current = true;
    try {
      const downloadPath = useSettingsStore.getState().modManager.downloadPath;
      if (!downloadPath) throw new Error("Download path not set");

      modsEventBus.emitProgressUpdated(
        t("mods.modOrderTab.progress.downloadingMod"),
      );

      unlisten = await events.downloadProgress.listen((event) => {
        const downloaded = formatBytes(parseInt(event.payload.downloadedBytes));
        const total = formatBytes(parseInt(event.payload.totalBytes));
        const percent = event.payload.percent * 100;
        modsEventBus.emitProgressUpdated(
          t("mods.modOrderTab.progress.downloadingModWithProgress", {
            downloaded,
            total,
            percent: Math.round(percent),
          }),
          event.payload.percent,
        );
      });

      const downloadedFile = await commands.downloadWithProgress(
        downloadLink,
        downloadPath,
      );
      console.log("Downloaded:", downloadedFile);

      try {
        if (modLinkRef.current) {
          modDetailsRef.current = await nexusmodsApi.retrieveModinfo(
            modLinkRef.current,
          );
        }
      } catch (error) {
        console.error(
          "Failed to retrieve additional information from API:",
          commandErrorToString(error as AnyError),
        );
      }

      modsEventBus.emitProgressFinished();

      installMod(downloadedFile);
    } catch (error) {
      modsEventBus.emitProgressAborted(error as AnyError);
    } finally {
      if (unlisten) unlisten();
      isPendingRef.current = false;
    }
  };

  const installMod = (downloadedFilePath: string) => {
    modsEventBus.emitInstallModFromFileWithPath(downloadedFilePath, {
      title: modDetailsRef.current?.name,
      version: modDetailsRef.current?.version,
      url: modLinkRef.current,
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (isPendingRef.current) return; // If currently busy, skip.
      if (isAnyModalShown) return; // If currently any modal is shown, skip.
      const nxmLink = nxmLinksQueueService.next();
      if (!nxmLink) return; // If link is undefined/null, skip.
      requestDownloadLinks(nxmLink).catch((reason) => {
        console.error(reason);
        modsEventBus.emitProgressAborted(reason as AnyError);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isAnyModalShown]);

  return (
    <>
      <ChooseCDNLinkModal
        show={isCdnModalShown}
        onAccept={(cdnLink) => {
          hideCdnModal();
          downloadMod(cdnLink.uri).catch((reason) => {
            console.error(reason);
            modsEventBus.emitProgressAborted(reason as AnyError);
          });
        }}
        onAbort={() => {
          hideCdnModal();
          isPendingRef.current = false;
        }}
        links={cdnLinks}
      />
    </>
  );
}
