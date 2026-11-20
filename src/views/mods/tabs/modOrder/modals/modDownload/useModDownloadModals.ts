import { commands, events, NexusModsDownloadLink } from "@/commands/bindings";
import { AnyError, commandErrorToString } from "@/commands/errors";
import NexusMods from "@/commands/nexusmods";
import { modsEventBus } from "@/services/mods";
import * as nexusmodsApi from "@/services/nexusmods";
import { nxmLinksQueueService } from "@/services/nxm";
import { useModsStore } from "@/stores/mods";
import {
  nexusmodsStoreAccountSync,
  useNexusModsStore,
} from "@/stores/nexusmods";
import { useSettingsStore } from "@/stores/settings";
import { useToastsStore } from "@/stores/toasts";
import { formatBytes } from "@/utils";
import { canUserDownloadDirectly, parseNexusModsUrl } from "@/utils/nexusmods";
import { openModal } from "@/hooks/useModal";
import { useModalStore } from "@/stores/modals";
import { UnlistenFn } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-shell";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import ChooseCDNLinkModal from "./ChooseCDNLinkModal";

type ModDetails = Awaited<ReturnType<typeof nexusmodsApi.retrieveModinfo>>;

interface DownloadSource {
  gameDomain: string;
  gameScopedId: number;
  fileId: number;
  url: string;
}

export function useModDownloadModals() {
  const { t } = useTranslation();
  const isAnyModalShown = useModalStore((store) => store.stack.length > 0);
  const isPendingRef = useRef(false);
  const downloadSourceRef = useRef<DownloadSource | undefined>(undefined);
  const updateModKeyRef = useRef<string | undefined>(undefined);
  const modDetailsRef = useRef<ModDetails | undefined>(undefined);

  async function chooseCdnLink(cdnLinks: NexusModsDownloadLink[]) {
    const cdnLink = await openModal(ChooseCDNLinkModal, { links: cdnLinks });
    if (cdnLink) {
      await downloadMod(cdnLink.uri);
    } else {
      isPendingRef.current = false;
    }
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

      const resp = await NexusMods.extractDetailsFromNxmUrl(nxmLink);
      downloadSourceRef.current = {
        ...resp,
        url: `https://www.nexusmods.com/${resp.gameDomain}/mods/${resp.gameScopedId}`,
      };
      updateModKeyRef.current = undefined;
      const cdnLinks = await NexusMods.api.nxmRequestDownloadLinks(
        apiKey,
        nxmLink,
      );

      modsEventBus.emitProgressFinished();

      if (!cdnLinks || cdnLinks.length == 0) {
        throw new Error("Didn't get any CDN links from API");
      } else if (cdnLinks.length > 1) {
        await chooseCdnLink(cdnLinks);
      } else {
        await downloadMod(cdnLinks[0].uri);
      }
    } catch (error) {
      modsEventBus.emitProgressAborted(error as AnyError);
      isPendingRef.current = false;
    }
  };

  const openFilesPageInBrowser = async (
    gameDomain: string,
    gameScopedId: number,
  ) => {
    const filesUrl = `https://www.nexusmods.com/${gameDomain}/mods/${gameScopedId}?tab=files`;
    useToastsStore
      .getState()
      .addToast(
        t("mods.modOrderTab.toasts.openingFilesPage"),
        filesUrl,
        "secondary",
      );
    await open(filesUrl);
  };

  const updateMod = async (modKey: string) => {
    if (isPendingRef.current) return;

    const mod = useModsStore.getState().getMod(modKey);
    if (!mod) {
      modsEventBus.emitProgressAborted(
        new Error(t("mods.modOrderTab.progress.modNotFound")),
      );
      return;
    }

    const parsed = parseNexusModsUrl(mod.url);
    if (!parsed) {
      modsEventBus.emitProgressAborted(
        new Error(`Couldn't extract IDs from URL: '${mod.url}'`),
      );
      return;
    }
    const { gameDomain, gameScopedId } = parsed;

    const modfile = useNexusModsStore.getState().modfiles.get(mod);
    const latestFileId = modfile?.latestFile?.fileId;

    let account = useNexusModsStore.getState().getAccountInfo();
    if (!account) {
      await nexusmodsStoreAccountSync.load();
      account = useNexusModsStore.getState().getAccountInfo();
    }

    if (
      !account ||
      !canUserDownloadDirectly(account) ||
      mod.nexusFileId == null
    ) {
      await openFilesPageInBrowser(gameDomain, gameScopedId);
      return;
    }

    if (latestFileId == null) {
      console.log(
        `Couldn't determine latest file of mod '${mod.title}' (nexusFileId: ${mod.nexusFileId}), opening the files page in the browser instead`,
      );
      await openFilesPageInBrowser(gameDomain, gameScopedId);
      return;
    }

    if (!(await checkApiKey())) return;
    isPendingRef.current = true;
    try {
      const apiKey = useNexusModsStore.getState().apiKey;
      if (!apiKey) throw new Error("API key not set");

      modsEventBus.emitProgressUpdated(
        t("mods.modOrderTab.progress.requestingCdnLinks"),
      );

      downloadSourceRef.current = {
        gameDomain,
        gameScopedId,
        fileId: latestFileId,
        url: `https://www.nexusmods.com/${gameDomain}/mods/${gameScopedId}`,
      };
      updateModKeyRef.current = mod.key;

      const cdnLinks = await NexusMods.api.requestDownloadLinks(
        apiKey,
        gameDomain,
        String(gameScopedId),
        latestFileId,
      );

      modsEventBus.emitProgressFinished();

      if (!cdnLinks || cdnLinks.length == 0) {
        throw new Error("Didn't get any CDN links from API");
      } else if (cdnLinks.length > 1) {
        await chooseCdnLink(cdnLinks);
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
        if (downloadSourceRef.current) {
          modDetailsRef.current = await nexusmodsApi.retrieveModinfo(
            downloadSourceRef.current.url,
            downloadSourceRef.current.fileId,
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
    modsEventBus.emitInstallModFromFileWithPath(
      downloadedFilePath,
      {
        title: modDetailsRef.current?.modinfo?.name || undefined,
        version:
          modDetailsRef.current?.modfile?.version ||
          modDetailsRef.current?.modinfo?.version,
        url: downloadSourceRef.current?.url,
        nexusFileId: downloadSourceRef.current?.fileId,
      },
      updateModKeyRef.current,
    );
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

  // React to messages:
  useEffect(
    () =>
      modsEventBus.onUIActionEvent((message) => {
        switch (message.type) {
          case "nexus-mods-update-mod":
            updateMod(message.key).catch((reason) => {
              console.error(reason);
              modsEventBus.emitProgressAborted(reason as AnyError);
            });
            break;
          // no default
        }
      }),
    [],
  );
}
