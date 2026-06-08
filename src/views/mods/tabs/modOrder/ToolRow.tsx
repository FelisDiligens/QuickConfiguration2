import { urls } from "@/info";
import { modsEventBus } from "@/services/mods";
import { useModsStore } from "@/stores/mods";
import {
  faBoxesStacked,
  faCircleCheck,
  faCircleDown,
  faCircleQuestion,
  faCircleXmark,
  faDownload,
  faEllipsis,
  faFileArrowDown,
  faFileCircleExclamation,
  faFileCirclePlus,
  faFileImport,
  faFolderPlus,
  faPlusSquare,
  faRefresh,
  faServer,
  faThumbsUp,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  getCurrentWebviewWindow,
  WebviewWindow,
} from "@tauri-apps/api/webviewWindow";
import { open } from "@tauri-apps/plugin-shell";
import { useRef } from "react";
import { Dropdown } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import {
  Toolbar,
  ToolButton,
  ToolDropdown,
  ToolSeparator,
} from "../../common/Toolbar";

const appWindow = getCurrentWebviewWindow();

export default function ToolRow() {
  const { t } = useTranslation();

  const modsEnabled = useModsStore((store) => store.enabled);
  const enableModsGlobally = useModsStore((store) => store.enableModsGlobally);
  const disableModsGlobally = useModsStore(
    (store) => store.disableModsGlobally,
  );
  const deploymentNecessary = useModsStore((store) =>
    store.isDeploymentNecessary(),
  );

  const dndWindow = useRef<WebviewWindow | null>(null);

  function openDragAndDropWindow() {
    if (dndWindow.current) {
      dndWindow.current.setFocus().catch(console.error);
      return;
    }
    const webview = new WebviewWindow("dragAndDropWindow", {
      url: "dnd-window.html",
      title: t("dragAndDropWindow.title"),
      dragDropEnabled: true,
      width: 400,
      height: 300,
    });

    webview
      .once("tauri://created", () => {
        console.log("Drag and drop window successfully created");
      })
      .catch((reason) =>
        console.error("Couldn't listen to tauri://created:", reason),
      );

    webview
      .once("tauri://error", (e) => {
        console.error("Error creating drag and drop window:", e);
        dndWindow.current = null;
      })
      .catch((reason) =>
        console.error("Couldn't listen to tauri://error:", reason),
      );

    webview
      .once("tauri://destroyed", () => {
        dndWindow.current = null;
      })
      .catch((reason) =>
        console.error("Couldn't listen to tauri://destroyed:", reason),
      );

    webview
      .onDragDropEvent((e) => {
        if (e.payload.type === "drop") {
          modsEventBus.emitInstallModFromPaths(e.payload.paths, {});
          appWindow.setFocus().catch(console.error);
        }
      })
      .catch((reason) =>
        console.error("Couldn't listen to Tauri drag and drop events:", reason),
      );

    dndWindow.current = webview;
  }

  return (
    <Toolbar>
      <ToolDropdown
        icon={faPlusSquare}
        label={t("mods.modOrderTab.toolbar.installMod")}
      >
        <Dropdown.Item onClick={() => modsEventBus.emitInstallModFromFile()}>
          <FontAwesomeIcon icon={faFileCirclePlus} />
          &nbsp;
          {t("mods.modOrderTab.toolbar.installFromFile")}
        </Dropdown.Item>
        <Dropdown.Item onClick={() => modsEventBus.emitInstallModFromFolder()}>
          <FontAwesomeIcon icon={faFolderPlus} />
          &nbsp;
          {t("mods.modOrderTab.toolbar.installFromFolder")}
        </Dropdown.Item>
        <Dropdown.Item onClick={openDragAndDropWindow}>
          <FontAwesomeIcon icon={faFileArrowDown} />
          &nbsp;{t("mods.modOrderTab.toolbar.openDragAndDropWindow")}
        </Dropdown.Item>
      </ToolDropdown>
      <ToolSeparator />
      <ToolButton
        icon={faCircleDown}
        variant={deploymentNecessary ? "primary" : undefined}
        onClick={() => modsEventBus.emitDeployMods()}
      >
        {t("mods.modOrderTab.toolbar.deployMods")}
      </ToolButton>
      {modsEnabled ? (
        <ToolButton icon={faCircleXmark} onClick={disableModsGlobally}>
          {t("mods.modOrderTab.toolbar.disableMods")}
        </ToolButton>
      ) : (
        <ToolButton icon={faCircleCheck} onClick={enableModsGlobally}>
          {t("mods.modOrderTab.toolbar.enableMods")}
        </ToolButton>
      )}
      <ToolSeparator />
      <ToolDropdown
        icon={faServer}
        label={t("mods.modOrderTab.toolbar.nexusMods")}
      >
        <Dropdown.Item
          onClick={() => modsEventBus.emitNexusModsCheckForUpdates()}
        >
          <FontAwesomeIcon icon={faRefresh} />
          &nbsp;
          {t("mods.modOrderTab.toolbar.checkForUpdates")}
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => modsEventBus.emitNexusModsDownloadModsInfo()}
        >
          <FontAwesomeIcon icon={faDownload} />
          &nbsp;
          {t("mods.modOrderTab.toolbar.downloadModInfo")}
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => modsEventBus.emitNexusModsEndorseAllMods()}
        >
          <FontAwesomeIcon icon={faThumbsUp} />
          &nbsp;
          {t("mods.modOrderTab.toolbar.endorseAllMods")}
        </Dropdown.Item>
      </ToolDropdown>
      <ToolDropdown
        icon={faBoxesStacked}
        label={t("mods.modOrderTab.toolbar.archive2")}
      >
        <Dropdown.Item onClick={() => modsEventBus.emitArchive2Open()}>
          {t("mods.modOrderTab.toolbar.openArchive2")}
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => modsEventBus.emitArchive2PickFileExploreBA2()}
        >
          {t("mods.modOrderTab.toolbar.exploreBa2Archive")}
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => modsEventBus.emitArchive2PickFileExtractBA2()}
        >
          {t("mods.modOrderTab.toolbar.extractBa2Archive")}
        </Dropdown.Item>
        <Dropdown.Item onClick={() => modsEventBus.emitArchive2CreateBA2()}>
          {t("mods.modOrderTab.toolbar.createBa2Archive")}
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => modsEventBus.emitArchive2AutoPackIntoArchives()}
        >
          {t("mods.modOrderTab.toolbar.autoPackIntoArchives")}
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => modsEventBus.emitArchive2PickFileAndDisplayMetadata()}
        >
          {t("mods.modOrderTab.toolbar.displayInfoAboutBa2Archive")}
        </Dropdown.Item>
      </ToolDropdown>
      <ToolDropdown
        icon={faEllipsis}
        label={t("mods.modOrderTab.toolbar.more")}
      >
        <Dropdown.Item
          onClick={() => modsEventBus.emitImportInstalledArchives()}
        >
          <FontAwesomeIcon icon={faFileImport} />
          &nbsp;
          {t("mods.modOrderTab.toolbar.importInstalledArchives")}
        </Dropdown.Item>
        <Dropdown.Item onClick={() => modsEventBus.emitShowConflictingFiles()}>
          <FontAwesomeIcon icon={faFileCircleExclamation} />
          &nbsp;{t("mods.modOrderTab.toolbar.showConflictingFiles")}
        </Dropdown.Item>
      </ToolDropdown>
      <ToolSeparator />
      <ToolButton onClick={() => open(urls.wiki.home)} icon={faCircleQuestion}>
        {t("mods.modOrderTab.toolbar.wikiAndGuides")}
      </ToolButton>
    </Toolbar>
  );
}
