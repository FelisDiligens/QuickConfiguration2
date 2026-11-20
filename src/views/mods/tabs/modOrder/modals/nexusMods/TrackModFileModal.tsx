import { NexusModsFileCategory, NexusModsModFile } from "@/commands/bindings";
import { AnyError, commandErrorToString } from "@/commands/errors";
import NexusMods from "@/commands/nexusmods";
import { FlexCol } from "@/components/common";
import { modsEventBus } from "@/services/mods";
import { useModsStore } from "@/stores/mods";
import { useNexusModsStore } from "@/stores/nexusmods";
import { useToastsStore } from "@/stores/toasts";
import { animationsEnabled, formatBytes } from "@/utils";
import { groupModFilesByCategory } from "@/utils/nexusmods";
import { css } from "@emotion/react";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMemo } from "react";
import { Button, Modal, OverlayTrigger, Table, Tooltip } from "react-bootstrap";
import { ModalComponentProps } from "@/stores/modals";
import { useTranslation } from "react-i18next";
import type { TrackModFileState } from "./types";

export default function TrackModFileModal(
  props: ModalComponentProps<TrackModFileState, void>,
) {
  const { t } = useTranslation();

  const categoryNames: Record<
    NonNullable<NexusModsFileCategory> | "OTHER",
    string
  > = {
    MAIN: t("mods.modOrderTab.modals.trackModFileModal.categories.main"),
    UPDATE: t("mods.modOrderTab.modals.trackModFileModal.categories.update"),
    OPTIONAL: t(
      "mods.modOrderTab.modals.trackModFileModal.categories.optional",
    ),
    MISCELLANEOUS: t(
      "mods.modOrderTab.modals.trackModFileModal.categories.miscellaneous",
    ),
    OLD_VERSION: t(
      "mods.modOrderTab.modals.trackModFileModal.categories.oldVersion",
    ),
    ARCHIVED: t(
      "mods.modOrderTab.modals.trackModFileModal.categories.archived",
    ),
    OTHER: t("mods.modOrderTab.modals.trackModFileModal.categories.other"),
  };

  const trackFile = async (file: NexusModsModFile) => {
    const state = props.data;
    if (!state) return;
    try {
      const modfile = await NexusMods.api.getModFileInfoFromModFiles(
        state.gameDomain,
        state.gameScopedId,
        file.fileId,
        state.modFiles,
      );
      useNexusModsStore.getState().addOrUpdateModfile(modfile);

      useModsStore
        .getState()
        .setMod(state.key, (mod) => ({ ...mod, nexusFileId: file.fileId }));

      useToastsStore
        .getState()
        .addToast(
          t("mods.modOrderTab.toasts.fileTracked"),
          modfile.name,
          "success",
        );

      props.close();
    } catch (error) {
      modsEventBus.emitProgressAborted(error as AnyError);
      console.error(
        `Failed to track file ${file.fileId}: ${commandErrorToString(error as AnyError)}`,
      );
    }
  };

  const groups = useMemo(
    () => groupModFilesByCategory(props.data.modFiles.files),
    [props.data],
  );

  return (
    <Modal
      animation={animationsEnabled}
      show={props.isOpen}
      onHide={props.cancel}
      size="xl"
      scrollable
      centered
      backdrop="static"
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <b>{t("mods.modOrderTab.modals.trackModFileModal.title")}</b>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>{t("mods.modOrderTab.modals.trackModFileModal.question")}</p>
        {groups.length === 0 ? (
          <p>{t("mods.modOrderTab.modals.trackModFileModal.noFiles")}</p>
        ) : (
          <FlexCol gap="1rem">
            {groups.map((group) => (
              <div key={group.category ?? "OTHER"}>
                <h6
                  css={css`
                    font-weight: 600;
                    padding-bottom: 3px;
                    border-bottom: 1px solid var(--bs-modal-header-border-color);
                  `}
                >
                  {categoryNames[group.category ?? "OTHER"]}
                </h6>
                <Table
                  striped
                  hover
                  size="sm"
                  css={css`
                    white-space: nowrap;
                    & td, & th {
                      padding: 5px 10px;
                      vertical-align: middle;
                    }
                    & td.expand, & th.expand {
                      width: 100%;
                    }
                    th {
                      font-weight: 600;
                      font-size: 0.8em;
                      opacity: 0.6;
                    }
                  `}
                >
                  <thead>
                    <tr>
                      <th className="expand">
                        {t(
                          "mods.modOrderTab.modals.trackModFileModal.tableHeaderFile",
                        )}
                      </th>
                      <th>
                        {t(
                          "mods.modOrderTab.modals.trackModFileModal.tableHeaderVersion",
                        )}
                      </th>
                      <th>
                        {t(
                          "mods.modOrderTab.modals.trackModFileModal.tableHeaderUploaded",
                        )}
                      </th>
                      <th>
                        {t(
                          "mods.modOrderTab.modals.trackModFileModal.tableHeaderSize",
                        )}
                      </th>
                      <th>
                        {t(
                          "mods.modOrderTab.modals.trackModFileModal.tableHeaderActions",
                        )}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.files.map((file) => (
                      <tr key={file.fileId}>
                        <td className="expand">
                          {file.isPrimary && (
                            <OverlayTrigger
                              placement="top"
                              overlay={
                                <Tooltip>
                                  {t(
                                    "mods.modOrderTab.modals.trackModFileModal.primaryFile",
                                  )}
                                </Tooltip>
                              }
                            >
                              <FontAwesomeIcon
                                icon={faStar}
                                css={css`
                                  color: var(--bs-warning);
                                  margin-right: 4px;
                                `}
                              />
                            </OverlayTrigger>
                          )}
                          {file.description.trim() !== "" ? (
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>{file.description}</Tooltip>}
                            >
                              <span>
                                {file.isPrimary ? (
                                  <b>{file.name}</b>
                                ) : (
                                  file.name
                                )}
                              </span>
                            </OverlayTrigger>
                          ) : file.isPrimary ? (
                            <b>{file.name}</b>
                          ) : (
                            file.name
                          )}
                        </td>
                        <td>{file.version}</td>
                        <td>{new Date(file.uploadedTime).toLocaleString()}</td>
                        <td>
                          {file.sizeInBytes != null
                            ? formatBytes(Number.parseInt(file.sizeInBytes, 10))
                            : "-"}
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => trackFile(file).catch(console.error)}
                          >
                            {t(
                              "mods.modOrderTab.modals.trackModFileModal.trackButton",
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ))}
          </FlexCol>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={props.cancel}>
          {t("common.cancel")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
