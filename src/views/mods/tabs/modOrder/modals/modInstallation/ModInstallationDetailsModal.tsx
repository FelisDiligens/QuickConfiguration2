import {
  commands,
  DiagnosticIssue,
  DirEntry,
  ManagedMod,
} from "@/commands/bindings";
import { AnyError, commandErrorToString } from "@/commands/errors";
import Mods from "@/commands/mods";
import Entry from "@/components/common/Entry";
import { FlexCol, FlexRow } from "@/components/common/Flex";
import Select from "@/components/common/Select";
import { AppTheme } from "@/components/MyThemeProvider";
import { useAsync } from "@/hooks/async";
import { useModsStore } from "@/stores/mods";
import { useProfilesStore } from "@/stores/profiles";
import { pathJoinSync } from "@/utils";
import { css } from "@emotion/react";
import {
  faArrowsRotate,
  faFileText,
  faFolder,
  faFolderOpen,
  faTriangleExclamation,
  faWrench,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as dialog from "@tauri-apps/plugin-dialog";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  Modal,
} from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { getModIdFromUrl } from "../../utils/getModInfo";
import FileContents from "./FileContents";

interface Props {
  show: boolean;
  onInstall: (mod: ManagedMod, paths: string[]) => void;
  onAbort: () => void;
  mod: ManagedMod;
  updateModKey?: string;
  fileContents: DirEntry[];
}

const textFileExtensions = ["txt", "md", "rst", "html", "rtf"];
const maxFileCountExpandedFolders = 1000;

function DiagnosticIssueAlert(props: {
  issue: DiagnosticIssue;
  fixable?: boolean;
  onFix?: () => void;
}) {
  const { t } = useTranslation();

  const warningText = useMemo(() => {
    switch (props.issue) {
      case "empty-folder":
        return t(
          "mods.modOrderTab.modals.installationModal.warnings.emptyFolder",
        );
      case "no-mod-files-found":
        return t(
          "mods.modOrderTab.modals.installationModal.warnings.noModFilesFound",
        );
      case "wrong-folder-for-archives":
        return t(
          "mods.modOrderTab.modals.installationModal.warnings.wrongFolderForArchives",
        );
      case "wrong-folder-for-strings":
        return t(
          "mods.modOrderTab.modals.installationModal.warnings.wrongFolderForStrings",
        );
      case "wrong-folder-for-dlls":
        return t(
          "mods.modOrderTab.modals.installationModal.warnings.wrongFolderForDlls",
        );
      case "multiple-ba2-roots":
        return t(
          "mods.modOrderTab.modals.installationModal.warnings.multipleBa2Archives",
        );
      case "unpacked-files":
        return t(
          "mods.modOrderTab.modals.installationModal.warnings.unpackedFiles",
        );
    }
  }, [props.issue, t]);

  return (
    <Alert variant="warning" css={css`margin: 0;`}>
      <FlexRow center gap="1rem">
        <FontAwesomeIcon icon={faTriangleExclamation} />
        <FlexRow grow>{warningText}</FlexRow>
        {props.fixable && (
          <Button onClick={props.onFix}>
            <FlexRow center gap="0.25rem">
              <FontAwesomeIcon icon={faWrench} />
              <span>
                {t(
                  "mods.modOrderTab.modals.installationModal.warnings.fixButton",
                )}
              </span>
            </FlexRow>
          </Button>
        )}
      </FlexRow>
    </Alert>
  );
}

export default function ModInstallationDetailsModal(props: Props) {
  const { t } = useTranslation();
  const mods = useModsStore((store) => store.mods);
  const getMod = useModsStore((store) => store.getMod);
  const tmpPath = useProfilesStore.getState().getModsTmpPath();
  const [mod, setMod] = useState(props.mod);
  const [updateModKey, setUpdateModKey] = useState(
    props.updateModKey ?? "none",
  );
  const [fileContents, setFileContents] = useState(props.fileContents);
  const [expandedPaths, setExpandedPaths] = useState(new Set<string>());
  const [enabledPaths, setEnabledPaths] = useState(new Set<string>());
  const [issues, setIssues] = useState<DiagnosticIssue[]>([]);
  const [error, setError] = useState<AnyError>(null);

  const getReadmes = (
    path: string,
    contents: DirEntry[],
  ): { path: string; name: string }[] => {
    let entries: { path: string; name: string }[] = [];
    for (const entry of contents) {
      const entryPath = pathJoinSync(path, entry.name);
      if (entry.type === "folder") {
        entries = [...entries, ...getReadmes(entryPath, entry.contents)];
      } else if (
        textFileExtensions.find((ext) => entry.name.endsWith("." + ext))
      ) {
        entries.push({
          path: entryPath,
          name: entry.name,
        });
      }
    }
    return entries;
  };

  const getFilePaths = (contents: DirEntry[]): string[] => {
    let paths: string[] = [];
    for (const entry of contents) {
      if (entry.type === "folder") {
        paths = [...paths, ...getFilePaths(entry.contents)];
      } else {
        paths.push(entry.path);
      }
    }
    return paths;
  };

  const getFolderPaths = (contents: DirEntry[]): string[] => {
    let paths: string[] = [];
    for (const entry of contents) {
      if (entry.type === "folder") {
        paths = [...paths, entry.path, ...getFolderPaths(entry.contents)];
      }
    }
    return paths;
  };

  const openContainingFolder = async () => {
    try {
      const tmpPath = useProfilesStore.getState().getModsTmpPath();
      if (!tmpPath) throw new Error("Temp path is null");
      await commands.openPathInFileExplorer(tmpPath);
    } catch (error) {
      console.error(commandErrorToString(error as AnyError));
      setError(error as AnyError);
    }
  };

  const refreshFileContents = async () => {
    try {
      const modsPath = useProfilesStore.getState().getModsPath();
      if (!modsPath) throw new Error("Mods path is null");
      if (!tmpPath) throw new Error("Temp path is null");
      const fileContents = await Mods.actions.tempFolder.listContent(modsPath);
      const fileCount = getFilePaths(props.fileContents).length;
      const enabledPaths =
        await Mods.actions.tempFolder.uncheckUnneededEntries(fileContents);
      const issues = await Mods.actions.tempFolder.diagnoseIssues(mod, tmpPath);
      setFileContents(fileContents);
      setEnabledPaths(new Set(enabledPaths));
      if (fileCount <= maxFileCountExpandedFolders)
        setExpandedPaths(new Set(getFolderPaths(fileContents)));
      else setExpandedPaths(new Set());
      setIssues(issues);
    } catch (error) {
      console.error(commandErrorToString(error as AnyError));
      setError(error as AnyError);
    }
  };

  const pickRootFolder = async () => {
    try {
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
      setMod((mod) => ({
        ...mod,
        options: { ...mod.options, rootFolder },
      }));
    } catch (error) {
      console.error(commandErrorToString(error as AnyError));
      setError(error as AnyError);
    }
  };

  useAsync({
    promiseFn: async () => {
      if (!tmpPath) throw new Error("Mods path is null");
      return await Mods.actions.tempFolder.diagnoseIssues(mod, tmpPath);
    },
    onResolved: setIssues,
    onRejected: (error) => {
      console.error(error);
      setError(error);
    },
    watch: [mod.options.rootFolder, tmpPath],
    enabled: props.show,
  });

  // Set values when props change:
  useEffect(() => {
    const filePaths = getFilePaths(props.fileContents);
    setMod(props.mod);
    setUpdateModKey(props.updateModKey ?? "none");
    setFileContents(props.fileContents);
    setEnabledPaths(new Set(filePaths));
    if (filePaths.length <= maxFileCountExpandedFolders)
      setExpandedPaths(new Set(getFolderPaths(props.fileContents)));
    else setExpandedPaths(new Set());
    setIssues([]);

    // Uncheck unneeded entries or print error:
    if (props.show)
      Mods.actions.tempFolder
        .uncheckUnneededEntries(props.fileContents)
        .then((enabledPaths) => setEnabledPaths(new Set(enabledPaths)))
        .catch((error) => {
          console.error(error);
          setError(error);
        });
  }, [props.mod, props.updateModKey, props.fileContents]);

  // Update mod details if `updateModKey` changes:
  useEffect(() => {
    const updateMod =
      updateModKey === "none" ? props.mod : getMod(updateModKey);
    if (!updateMod) return;
    setMod((mod) => ({
      ...mod,
      key: updateMod.key,
      title: updateMod.title,
      version:
        updateModKey === "none"
          ? updateMod.version
          : mod.version || updateMod.version,
      url: updateMod.url,
      folderName: updateMod.folderName,
      enabled: updateMod.enabled,
      options: {
        ...mod.options,
        rootFolder: updateMod.options.rootFolder,
      },
    }));
  }, [updateModKey]);

  const readmes = useMemo(() => {
    const tmpPath = useProfilesStore.getState().getModsTmpPath();
    return tmpPath ? getReadmes(tmpPath, fileContents) : [];
  }, [useProfilesStore, fileContents]);

  const modId = useMemo(() => getModIdFromUrl(mod.url), [mod.url]);
  const matchingMods = useMemo(
    () =>
      modId != undefined
        ? mods.filter((currMod) => getModIdFromUrl(currMod.url) === modId)
        : [],
    [mods, modId],
  );

  return (
    <Modal
      show={props.show}
      onHide={props.onAbort}
      css={(theme: AppTheme) => css`
        & .modal-dialog {
          max-width: calc(${theme.card.maxWidth} + 40px);
        }
      `}
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {t("mods.modOrderTab.modals.installationModal.title")}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>{t("mods.modOrderTab.modals.installationModal.instructionsText")}</p>
        {error && (
          <Alert variant="danger" css={css`margin: 0;`}>
            <FlexRow center gap="1rem">
              <FontAwesomeIcon icon={faTriangleExclamation} />
              <FlexRow grow>{commandErrorToString(error)}</FlexRow>
            </FlexRow>
          </Alert>
        )}
        <FlexCol gap="1rem">
          {readmes.length > 0 && (
            <Card>
              <CardHeader>
                {t(
                  "mods.modOrderTab.modals.installationModal.readmeCardHeader",
                )}
              </CardHeader>
              <CardBody>
                <p>
                  {t(
                    "mods.modOrderTab.modals.installationModal.readmeCardText",
                  )}
                </p>
                <FlexRow
                  wrap
                  gap="8px"
                  css={css`max-height: 200px; overflow: auto;`}
                >
                  {readmes.map((readme) => (
                    <Button
                      key={readme.path}
                      variant="secondary"
                      onClick={() =>
                        commands
                          .openPathInFileExplorer(readme.path)
                          .catch((error) => {
                            console.error(error);
                            setError(error);
                          })
                      }
                    >
                      <FontAwesomeIcon icon={faFileText} />
                      &nbsp;
                      <span>{readme.name}</span>
                    </Button>
                  ))}
                </FlexRow>
              </CardBody>
            </Card>
          )}
          {issues.map((issue) => (
            <DiagnosticIssueAlert key={issue} issue={issue} />
          ))}
          <Card>
            <CardHeader>
              {t("mods.modOrderTab.modals.installationModal.updateGroup")}
            </CardHeader>
            <CardBody>
              <Select
                value={updateModKey}
                onChange={setUpdateModKey}
                style={{
                  fontStyle: updateModKey === "none" ? "italic" : undefined,
                }}
                label={t("mods.modOrderTab.modals.installationModal.mod", {
                  count: 1,
                })}
              >
                <option value="none">
                  {t("mods.modOrderTab.modals.installationModal.newMod")}
                </option>
                {matchingMods.length > 0 && (
                  <optgroup
                    label={t(
                      "mods.modOrderTab.modals.installationModal.matchingMod",
                      {
                        count: matchingMods.length,
                      },
                    )}
                  >
                    {matchingMods.map((mod) => (
                      <option key={mod.key} value={mod.key}>
                        {mod.title}
                      </option>
                    ))}
                  </optgroup>
                )}
                {mods.length > 0 && (
                  <optgroup
                    label={t(
                      "mods.modOrderTab.modals.installationModal.allMods",
                      {
                        count: mods.length,
                      },
                    )}
                  >
                    {mods.map((mod) => (
                      <option key={mod.key} value={mod.key}>
                        {mod.title}
                      </option>
                    ))}
                  </optgroup>
                )}
              </Select>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              {t("mods.modOrderTab.modals.installationModal.detailsGroup")}
            </CardHeader>
            <CardBody>
              <FlexCol gap="0.5rem">
                <Entry
                  label={t("mods.modOrderTab.modals.installationModal.modName")}
                  value={mod.title}
                  onChange={(title) => setMod((mod) => ({ ...mod, title }))}
                />
                <Entry
                  label={t("mods.modOrderTab.modals.installationModal.version")}
                  value={mod.version}
                  onChange={(version) => setMod((mod) => ({ ...mod, version }))}
                />
                <Entry
                  label={t("mods.modOrderTab.modals.installationModal.url")}
                  value={mod.url}
                  onChange={(url) => setMod((mod) => ({ ...mod, url }))}
                />
              </FlexCol>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              {t("mods.modOrderTab.modals.installationModal.installationGroup")}
            </CardHeader>
            <CardBody>
              <FlexCol gap="0.5rem">
                <FlexRow gap="0.5rem">
                  <Entry
                    label={t(
                      "mods.modOrderTab.modals.installationModal.installInto",
                    )}
                    value={mod.options.rootFolder}
                    onChange={(rootFolder) =>
                      setMod((mod) => ({
                        ...mod,
                        options: { ...mod.options, rootFolder },
                      }))
                    }
                  />
                  <Button
                    variant="outline-primary"
                    title={t(
                      "mods.modOrderTab.modals.installationModal.selectFolder",
                    )}
                    onClick={pickRootFolder}
                  >
                    <FontAwesomeIcon icon={faFolder} />
                  </Button>
                </FlexRow>
                <Entry
                  label={t(
                    "mods.modOrderTab.modals.installationModal.modFolderName",
                  )}
                  value={mod.folderName}
                  onChange={(folderName) =>
                    setMod((mod) => ({ ...mod, folderName }))
                  }
                  disabled={updateModKey !== "none"}
                />
              </FlexCol>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <FlexRow center>
                <FlexRow grow>
                  {t("mods.modOrderTab.modals.installationModal.fileContents")}
                </FlexRow>
                <FlexRow gap="0.5rem">
                  <Button
                    variant="outline-primary"
                    title={t("mods.modOrderTab.detailsPane.openModFolder")}
                    onClick={() => openContainingFolder().catch(console.error)}
                  >
                    <FontAwesomeIcon icon={faFolderOpen} />
                  </Button>
                  <Button
                    variant="outline-primary"
                    title={t("common.reload")}
                    onClick={() => refreshFileContents().catch(console.error)}
                  >
                    <FontAwesomeIcon icon={faArrowsRotate} />
                  </Button>
                </FlexRow>
              </FlexRow>
            </CardHeader>
            <CardBody>
              <p>
                {t(
                  "mods.modOrderTab.modals.installationModal.fileSelectionText",
                )}
              </p>
              <FileContents
                contents={fileContents}
                maxHeight={400}
                enabledPaths={enabledPaths}
                expandedPaths={expandedPaths}
                setEnabledPaths={setEnabledPaths}
                setExpandedPaths={setExpandedPaths}
              />
            </CardBody>
          </Card>
        </FlexCol>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="primary"
          onClick={() => props.onInstall(mod, [...enabledPaths])}
        >
          {t("mods.modOrderTab.modals.installationModal.installButton")}
        </Button>
        <Button variant="secondary" onClick={props.onAbort}>
          {t("mods.modOrderTab.modals.installationModal.cancelButton")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
