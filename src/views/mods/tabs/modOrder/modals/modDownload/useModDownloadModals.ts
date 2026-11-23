import {
  commands,
  events,
  ManagedMod,
  NexusModsDownloadLink,
  NexusModsModFile,
} from "@/commands/bindings";
import { AnyError, commandErrorToString } from "@/commands/errors";
import NexusMods from "@/commands/nexusmods";
import { errorModal, loadingModal, openModal } from "@/hooks/useModal";
import * as nexusmodsApi from "@/services/nexusmods";
import { useModsStore } from "@/stores/mods";
import {
  nexusmodsStoreAccountSync,
  useNexusModsStore,
} from "@/stores/nexusmods";
import { useSettingsStore } from "@/stores/settings";
import { useToastsStore } from "@/stores/toasts";
import { formatBytes } from "@/utils";
import { canUserDownloadDirectly, parseNexusModsUrl } from "@/utils/nexusmods";
import { UnlistenFn } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-shell";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import ChooseCDNLinkModal from "./ChooseCDNLinkModal";
import PickModFileModal from "./PickModFileModal";

type ModDetails = Awaited<ReturnType<typeof nexusmodsApi.retrieveModinfo>>;

interface DownloadSource {
  gameDomain: string;
  gameScopedId: number;
  fileId: number;
  url: string;
}

export function useModDownloadModals(options: {
  onNotLoggedIn?: () => void;
  onInstallMod: (
    filePath: string,
    partialModDetails: Partial<ManagedMod>,
    updateModKey?: string,
  ) => void;
}) {
  const { t } = useTranslation();
  const isPendingRef = useRef(false);

  async function chooseCdnLink(cdnLinks: NexusModsDownloadLink[]) {
    const cdnLink = await openModal(ChooseCDNLinkModal, { links: cdnLinks });
    if (cdnLink) {
      return cdnLink.uri;
    } else {
      isPendingRef.current = false;
      return undefined;
    }
  }

  async function chooseModFileToDownload(
    apiKey: string,
    gameDomain: string,
    gameScopedId: number,
    modTitle: string,
  ): Promise<NexusModsModFile | undefined> {
    const listingModalState = loadingModal();
    try {
      listingModalState.open({
        label: t("mods.modOrderTab.progress.listingModFiles"),
      });

      const modFiles = await NexusMods.api.listModFiles(
        apiKey,
        gameDomain,
        gameScopedId,
        null,
      );

      await listingModalState.close();
      const file = await openModal(PickModFileModal, { modTitle, modFiles });
      if (file) {
        return file;
      } else {
        isPendingRef.current = false;
        return undefined;
      }
    } finally {
      await listingModalState.close();
    }
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

    // If we got no API key, show a message to the user that they have to login:
    if (options.onNotLoggedIn) options.onNotLoggedIn();
    return false;
  }

  async function loadNexusModsAccount() {
    let account = useNexusModsStore.getState().getAccountInfo();
    if (!account) {
      await nexusmodsStoreAccountSync.load();
      account = useNexusModsStore.getState().getAccountInfo();
    }
    return account;
  }

  const requestDownloadLinks = async (nxmLink: string) => {
    if (!(await checkApiKey())) return;
    isPendingRef.current = true;

    const loadingModalState = loadingModal();
    try {
      const apiKey = useNexusModsStore.getState().apiKey;
      if (!apiKey) throw new Error("API key not set");

      loadingModalState.open({
        label: t("mods.modOrderTab.progress.requestingCdnLinks"),
      });

      const resp = await NexusMods.extractDetailsFromNxmUrl(nxmLink);
      const downloadSource: DownloadSource = {
        ...resp,
        url: `https://www.nexusmods.com/${resp.gameDomain}/mods/${resp.gameScopedId}`,
      };
      const cdnLinks = await NexusMods.api.nxmRequestDownloadLinks(
        apiKey,
        nxmLink,
      );

      await loadingModalState.close();
      if (!cdnLinks || cdnLinks.length == 0) {
        throw new Error("Didn't get any CDN links from API");
      }
      let cdnLink: string | undefined;
      if (cdnLinks.length > 1) {
        cdnLink = await chooseCdnLink(cdnLinks);
      } else {
        cdnLink = cdnLinks[0].uri;
      }
      if (cdnLink) await downloadMod(cdnLink, downloadSource);
    } catch (error) {
      console.error(error);
      void errorModal({ reason: error as AnyError });
      isPendingRef.current = false;
    } finally {
      await loadingModalState.close();
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

    const loadingModalState = loadingModal();
    try {
      // Fail if mod is not found or has no valid URL:

      const mod = useModsStore.getState().getMod(modKey);
      if (!mod) throw new Error(t("mods.modOrderTab.progress.modNotFound"));

      const parsed = parseNexusModsUrl(mod.url);
      if (!parsed)
        throw new Error(`Couldn't extract IDs from URL: '${mod.url}'`);
      const { gameDomain, gameScopedId } = parsed;

      let modfile = useNexusModsStore.getState().modfiles.get(mod);
      let latestFileId = modfile?.latestFile?.fileId;

      // Open the browser if the user is not logged in, has no account info available, or is not a premium subscriber:

      const apiKey = await loadApiKey();
      const account = await loadNexusModsAccount();
      if (!apiKey || !account || !canUserDownloadDirectly(account)) {
        await openFilesPageInBrowser(gameDomain, gameScopedId);
        return;
      }

      // Determine next file ID either by consulting API or asking the user:

      if (mod.nexusFileId != null && modfile?.fileId !== mod.nexusFileId) {
        console.log(
          `Tracked file ID ${mod.nexusFileId} doesn't match the cached mod file info, fetching the file info from the API again`,
        );
        const freshModfile = await NexusMods.api.getModFile(
          apiKey,
          gameDomain,
          gameScopedId,
          mod.nexusFileId,
        );
        useNexusModsStore.getState().addOrUpdateModfile(freshModfile);
        modfile = useNexusModsStore.getState().modfiles.get(mod);
        latestFileId = modfile?.latestFile?.fileId;
      }

      if (mod.nexusFileId == null || latestFileId == null) {
        console.log(
          `Couldn't determine latest file of mod '${mod.title}' (nexusFileId: ${mod.nexusFileId}), asking the user which file to download instead`,
        );
        isPendingRef.current = true;
        const file = await chooseModFileToDownload(
          apiKey,
          gameDomain,
          gameScopedId,
          mod.title,
        );
        if (!file) return;
        latestFileId = file.fileId;
      }

      // Download new mod file:

      isPendingRef.current = true;
      loadingModalState.open({
        label: t("mods.modOrderTab.progress.requestingCdnLinks"),
      });

      const downloadSource: DownloadSource = {
        gameDomain,
        gameScopedId,
        fileId: latestFileId,
        url: `https://www.nexusmods.com/${gameDomain}/mods/${gameScopedId}`,
      };

      const cdnLinks = await NexusMods.api.requestDownloadLinks(
        apiKey,
        gameDomain,
        String(gameScopedId),
        latestFileId,
      );

      await loadingModalState.close();
      if (!cdnLinks || cdnLinks.length == 0) {
        throw new Error("Didn't get any CDN links from API");
      }
      let cdnLink: string | undefined;
      if (cdnLinks.length > 1) {
        cdnLink = await chooseCdnLink(cdnLinks);
      } else {
        cdnLink = cdnLinks[0].uri;
      }
      if (cdnLink) await downloadMod(cdnLink, downloadSource, mod.key);
    } catch (error) {
      console.error(error);
      void errorModal({ reason: error as AnyError });
      isPendingRef.current = false;
    } finally {
      await loadingModalState.close();
    }
  };

  const downloadMod = async (
    downloadLink: string,
    downloadSource: DownloadSource,
    updateModKey?: string,
  ) => {
    let unlisten: UnlistenFn | undefined = undefined;
    isPendingRef.current = true;

    const loadingModalState = loadingModal();
    try {
      const downloadPath = useSettingsStore.getState().modManager.downloadPath;
      if (!downloadPath) throw new Error("Download path not set");

      loadingModalState.open({
        label: t("mods.modOrderTab.progress.downloadingMod"),
      });

      unlisten = await events.downloadProgress.listen((event) => {
        const downloaded = formatBytes(parseInt(event.payload.downloadedBytes));
        const total = formatBytes(parseInt(event.payload.totalBytes));
        const percent = event.payload.percent * 100;
        loadingModalState.update({
          label: t("mods.modOrderTab.progress.downloadingModWithProgress", {
            downloaded,
            total,
            percent: Math.round(percent),
          }),
          progress: percent,
        });
      });

      const downloadedFile = await commands.downloadWithProgress(
        downloadLink,
        downloadPath,
      );
      console.log("Downloaded:", downloadedFile);

      let modDetails: ModDetails | undefined = undefined;
      try {
        const apiKey = await loadApiKey();
        if (!apiKey) throw new Error("API key is not set");

        const ids = parseNexusModsUrl(downloadSource.url);
        if (!ids) throw new Error("URL could not be parsed");

        modDetails = await nexusmodsApi.retrieveModinfo(
          apiKey,
          ids.gameDomain,
          ids.gameScopedId,
          downloadSource.fileId,
        );
      } catch (error) {
        console.error(
          "Failed to retrieve additional information from API:",
          commandErrorToString(error as AnyError),
        );
      }

      await loadingModalState.close();
      options.onInstallMod(
        downloadedFile,
        {
          title: modDetails?.modinfo.name || undefined,
          version: modDetails?.modfile?.version || modDetails?.modinfo.version,
          url: downloadSource.url,
          nexusFileId: downloadSource.fileId,
        },
        updateModKey,
      );
    } catch (error) {
      console.error(error);
      void errorModal({ reason: error as AnyError });
    } finally {
      if (unlisten) unlisten();
      isPendingRef.current = false;
      await loadingModalState.close();
    }
  };

  return {
    requestDownloadLinks,
    updateMod,
    isPendingRef,
  };
}
