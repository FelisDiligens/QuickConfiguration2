import {
  commands,
  ManagedMod,
  ModInstallationState,
  NexusModsModInfo,
} from "@/commands/bindings";
import { AnyError, commandErrorToString } from "@/commands/errors";
import Mods from "@/commands/mods";
import Entry from "@/components/common/Entry";
import { Flex, FlexCol, FlexRow } from "@/components/common/Flex";
import { useLazyAsync } from "@/hooks/async";
import useModinfos from "@/hooks/nexusmods/useModinfos";
import { modsEventBus } from "@/services/mods";
import { updateModsStore, useModsStore } from "@/stores/mods";
import { useProfilesStore } from "@/stores/profiles";
import { useSettingsStore } from "@/stores/settings";
import { css } from "@emotion/react";
import {
  faArrowUpRightFromSquare,
  faFolder,
  faFolderOpen,
  faRotateLeft,
  faThumbsDown,
  faThumbsUp,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { path } from "@tauri-apps/api";
import * as dialog from "@tauri-apps/plugin-dialog";
import { open } from "@tauri-apps/plugin-shell";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, CardBody, CardHeader, Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { useDebouncedCallback } from "use-debounce";
import { getModInfo } from "./utils/getModInfo";

/**
 * Hook for handling mod folder renaming with debouncing and error handling
 */
function useModFolderRename(mod: ManagedMod) {
  const { t } = useTranslation();
  const [folderName, setFolderName] = useState(mod.folderName);
  const oldFolderName = useRef("");
  const newFolderName = useRef("");

  const getManagedMods = useModsStore((store) => store.getManagedMods);
  const modToRename = useModsStore((store) => store.getMod(mod.key));
  const modsPath = useProfilesStore((store) => store.getModsPath());

  // Reset state if another mod is passed to the hook:
  useEffect(() => {
    setFolderName(mod.folderName);
  }, [mod.key]);

  const {
    run: rename,
    error,
    setError,
    isPending,
  } = useLazyAsync({
    promiseFn: async (modKey: string, newFolderName: string) => {
      if (!modsPath) throw new Error(t("mods.errors.unsetModsPath"));
      if (!modToRename) throw new Error(`Mod with key ${modKey} not found`);
      return await Mods.actions.mod.renameFolder(
        getManagedMods(),
        modsPath,
        modKey,
        newFolderName,
      );
    },
    onResolved: (update) => {
      if (update) updateModsStore(update);
      console.log(
        `Renamed folder: "${oldFolderName.current}" -> "${newFolderName.current}"`,
      );
    },
    onRejected: (error: AnyError) =>
      console.error("Failed to renamed folder:", commandErrorToString(error)),
  });

  const debouncedRename = useDebouncedCallback(rename, 500);
  useEffect(() => () => debouncedRename.flush(), []); // flush rename on unmount

  const handleFolderRename = (folderName: string) => {
    setError(null);
    setFolderName(folderName);
    oldFolderName.current = modToRename?.folderName || "";
    newFolderName.current = folderName;
    if (oldFolderName.current != newFolderName.current)
      debouncedRename(mod.key, folderName);
    else debouncedRename.cancel();
  };

  return {
    folderName,
    renameError: error,
    isRenaming: isPending,
    handleFolderRename,
  };
}

function PreviewImage(props: { src: string }) {
  return (
    <div
      css={css`
          background-color: black;
          height: 160px;
          flex-shrink: 0;
          & > img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
        `}
    >
      <img src={props.src} />
    </div>
  );
}

function StickyHeader(props: {
  mod: ManagedMod;
  modinfo?: NexusModsModInfo;
  showNexusModsTitle: boolean;
  enableMod: (key: string) => void;
  disableMod: (key: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <FlexRow
      noShrink
      css={css`
        padding: 8px 12px;
        height: 90px;
        background-color: var(--bs-tertiary-bg);
      `}
    >
      {/* Left side: Title and enable checkbox */}
      <FlexCol
        grow
        gap="8px"
        css={css`
          margin-top: 4px;
        `}
      >
        <span
          css={css`
            font-size: 1.25em;
            width: 270px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          `}
        >
          {props.showNexusModsTitle && props.modinfo?.name
            ? props.modinfo.name
            : props.mod.title}
        </span>
        <Form.Check
          checked={props.mod.enabled}
          onChange={(ev) => {
            if (ev.target.checked) {
              props.enableMod(props.mod.key);
            } else {
              props.disableMod(props.mod.key);
            }
          }}
          label={t("mods.modOrderTab.detailsPane.enableThisMod")}
          css={css`font-size: 0.9em;`}
        />
      </FlexCol>

      {/* Right side: Endorse/Abstain button with small text underneath */}
      {props.modinfo && (
        <FlexRow
          gap="0.5rem"
          css={css`
          position: relative;
          height: 40px;
        `}
        >
          <Button
            variant="outline-success"
            onClick={() => modsEventBus.emitNexusModsEndorseMod(props.mod.key)}
            disabled={props.modinfo?.endorseStatus === "Endorsed"}
          >
            <FontAwesomeIcon icon={faThumbsUp} />
          </Button>
          <Button
            variant="outline-danger"
            onClick={() => modsEventBus.emitNexusModsAbstainMod(props.mod.key)}
            disabled={props.modinfo?.endorseStatus === "Abstained"}
          >
            <FontAwesomeIcon icon={faThumbsDown} />
          </Button>
          <span
            css={css`
            position: absolute;
            bottom: -24px;
            right: 0px;
            min-width: 200px;
            height: 20px;
            text-align: right;
            font-size: 0.75em;
          `}
          >
            {props.modinfo?.endorseStatus === "Endorsed" &&
              t("mods.modOrderTab.detailsPane.endorsedText")}
            {props.modinfo?.endorseStatus === "Abstained" &&
              t("mods.modOrderTab.detailsPane.abstainedText")}
            {props.modinfo?.endorseStatus === "Undecided" &&
              t("mods.modOrderTab.detailsPane.undecidedText")}
          </span>
        </FlexRow>
      )}
    </FlexRow>
  );
}

function Options(props: {
  mod: ManagedMod;
  state?: ModInstallationState;
  setMod: React.Dispatch<React.SetStateAction<ManagedMod>>;
  modinfo?: NexusModsModInfo;
}) {
  const { t } = useTranslation();
  const { folderName, renameError, isRenaming, handleFolderRename } =
    useModFolderRename(props.mod);

  const pickRootFolder = async () => {
    const gamePath = useProfilesStore.getState().getGamePath();
    const folderPath = await dialog.open({
      directory: true,
      multiple: false,
      defaultPath: gamePath || undefined,
    });
    if (!folderPath) return;
    const rootFolder = gamePath
      ? await commands.pathStripPrefix(gamePath, folderPath)
      : folderPath;
    props.setMod((mod) => ({
      ...mod,
      options: { ...mod.options, rootFolder },
    }));
  };

  const openModFolder = async () => {
    const modsPath = useProfilesStore.getState().getModsPath();
    if (!modsPath) {
      console.error("Mods path is null");
      return;
    }
    const folderPath = await path.join(modsPath, props.mod.folderName);
    commands.openPathInFileExplorer(folderPath).catch(console.error);
  };

  return (
    <FlexCol
      gap="1rem"
      css={css`
        overflow-y: auto;
        overflow-x: hidden;
        padding: 8px;
      `}
    >
      <Card>
        <CardHeader>
          {t("mods.modOrderTab.detailsPane.detailsGroup")}
        </CardHeader>
        <CardBody>
          <FlexCol gap="0.5rem">
            <Entry
              label={t("mods.modOrderTab.detailsPane.modName")}
              value={props.mod.title}
              onChange={(value) => {
                props.setMod((mod) => ({ ...mod, title: value }));
              }}
            />
            <Entry
              label={t("mods.modOrderTab.detailsPane.installedVersion")}
              value={props.mod.version}
              onChange={(value) => {
                props.setMod((mod) => ({ ...mod, version: value }));
              }}
            />
            <FlexRow gap="0.5rem">
              <Entry
                label={t("mods.modOrderTab.detailsPane.webpageUrl")}
                value={props.mod.url}
                onChange={(value) => {
                  props.setMod((mod) => ({ ...mod, url: value }));
                }}
              />
              <Button
                variant="outline-primary"
                title={t("mods.modOrderTab.detailsPane.openLinkInBrowser")}
                onClick={() => {
                  if (props.mod.url) open(props.mod.url).catch(console.error);
                }}
              >
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
              </Button>
            </FlexRow>
            <Entry
              label={t("mods.modOrderTab.detailsPane.notes")}
              value={props.mod.notes}
              onChange={(value) => {
                props.setMod((mod) => ({ ...mod, notes: value }));
              }}
            />
          </FlexCol>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          {t("mods.modOrderTab.detailsPane.installationGroup")}
        </CardHeader>
        <CardBody>
          <FlexCol gap="0.5rem">
            <FlexRow gap="0.5rem">
              <Entry
                label={t("mods.modOrderTab.detailsPane.installInto")}
                value={props.mod.options.rootFolder}
                onChange={(value) => {
                  props.setMod((mod) => ({
                    ...mod,
                    options: { ...mod.options, rootFolder: value },
                  }));
                }}
              />
              <Button
                variant="outline-primary"
                title={t("mods.modOrderTab.detailsPane.selectFolder")}
                onClick={pickRootFolder}
              >
                <FontAwesomeIcon icon={faFolder} />
              </Button>
              <Button
                variant="outline-danger"
                title={t("mods.modOrderTab.detailsPane.resetPath")}
                onClick={() => {
                  let rootFolder = ".";
                  if (props.state?.rootFolder)
                    rootFolder = props.state.rootFolder;
                  props.setMod((mod) => ({
                    ...mod,
                    options: { ...mod.options, rootFolder },
                  }));
                }}
              >
                <FontAwesomeIcon icon={faRotateLeft} />
              </Button>
            </FlexRow>
            <FlexRow gap="0.5rem">
              <Entry
                label={t("mods.modOrderTab.detailsPane.modFolderName")}
                value={folderName}
                onChange={handleFolderRename}
                isInvalid={!!renameError}
              />
              <Button
                variant="outline-primary"
                title={t("mods.modOrderTab.detailsPane.openModFolder")}
                onClick={openModFolder}
                disabled={isRenaming}
              >
                <FontAwesomeIcon icon={faFolderOpen} />
              </Button>
            </FlexRow>
            {renameError && (
              <div
                css={css`
                  color: var(--bs-danger);
                  font-size: 0.8em;
                  margin-top: 0.25rem;
                  margin-left: 0.5rem;
                `}
              >
                {t("mods.modOrderTab.detailsPane.renameFailed", {
                  error: commandErrorToString(renameError),
                })}
              </div>
            )}
          </FlexCol>
        </CardBody>
      </Card>

      {props.modinfo && (
        <Card>
          <CardHeader>
            {t("mods.modOrderTab.detailsPane.nexusmodsGroup")}
          </CardHeader>
          <CardBody>
            <FlexCol gap="0.5rem">
              <FlexRow gap="0.5rem" css={css`padding: 5px 4px;`}>
                <span>
                  <b>{t("mods.modOrderTab.detailsPane.latestVersion")}</b>
                  :&nbsp;
                </span>
                <span>{props.modinfo?.version}</span>
                <Flex grow />
                <a
                  href="#"
                  onClick={(e) => {
                    props.setMod((mod) => ({
                      ...mod,
                      version: props.modinfo?.version || mod.version,
                    }));
                    e.preventDefault();
                  }}
                >
                  {t("mods.modOrderTab.detailsPane.setLatestVersion")}
                </a>
              </FlexRow>
              <FlexRow gap="0.5rem" css={css`padding: 5px 4px;`}>
                <span>
                  <b>{t("mods.modOrderTab.detailsPane.author")}</b>:&nbsp;
                </span>
                <span>{props.modinfo?.author}</span>
              </FlexRow>
              <Button
                variant="secondary"
                onClick={() =>
                  modsEventBus.emitNexusModsDownloadModInfo(props.mod.key)
                }
              >
                {t("mods.modOrderTab.detailsPane.downloadModInfo")}
              </Button>
            </FlexCol>
          </CardBody>
        </Card>
      )}
    </FlexCol>
  );
}

export default function ModDetails() {
  const mods = useModsStore((store) => store.mods);
  const setMod = useModsStore((store) => store.setMod);
  const getModState = useModsStore((store) => store.getModState);
  const selectedModIndex = useModsStore((store) => store.getSelectedModIndex());
  const enableMod = useModsStore((store) => store.enableMod);
  const disableMod = useModsStore((store) => store.disableMod);
  const showNexusModsTitle = useSettingsStore(
    (store) => store.modManager.showNexusModsTitle,
  );
  const { modinfos } = useModinfos();

  const mod = mods[selectedModIndex];
  const state = useMemo(() => getModState(mod.key), [mod.key]);
  const modinfo = getModInfo(mod, modinfos);
  const modImgSrc = modinfo?.pictureUrl;

  return (
    <FlexCol
      noShrink
      css={css`
        width: 400px;
      `}
    >
      {modImgSrc && <PreviewImage src={modImgSrc} />}
      <StickyHeader
        mod={mod}
        modinfo={getModInfo(mod, modinfos)}
        showNexusModsTitle={showNexusModsTitle}
        enableMod={enableMod}
        disableMod={disableMod}
      />
      <Options
        mod={mod}
        state={state}
        setMod={(value) => setMod(mod.key, value)}
        modinfo={modinfo}
      />
    </FlexCol>
  );
}
