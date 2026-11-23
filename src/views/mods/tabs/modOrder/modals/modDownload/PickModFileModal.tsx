import {
  NexusModsFileCategory,
  NexusModsModFile,
  NexusModsModFiles,
} from "@/commands/bindings";
import { FlexCol } from "@/components/common";
import { ModalComponentProps } from "@/stores/modals";
import { animationsEnabled, formatBytes } from "@/utils";
import { groupModFilesByCategory } from "@/utils/nexusmods";
import { css } from "@emotion/react";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMemo } from "react";
import { Button, Modal, OverlayTrigger, Table, Tooltip } from "react-bootstrap";
import { useTranslation } from "react-i18next";

export interface PickModFileModalData {
  modTitle: string;
  modFiles: NexusModsModFiles;
}

export default function PickModFileModal(
  props: ModalComponentProps<PickModFileModalData, NexusModsModFile>,
) {
  const { t } = useTranslation();

  const categoryNames: Record<
    NonNullable<NexusModsFileCategory> | "OTHER",
    string
  > = {
    MAIN: t("mods.modOrderTab.modals.modFileModals.categories.main"),
    UPDATE: t("mods.modOrderTab.modals.modFileModals.categories.update"),
    OPTIONAL: t("mods.modOrderTab.modals.modFileModals.categories.optional"),
    MISCELLANEOUS: t(
      "mods.modOrderTab.modals.modFileModals.categories.miscellaneous",
    ),
    OLD_VERSION: t(
      "mods.modOrderTab.modals.modFileModals.categories.oldVersion",
    ),
    ARCHIVED: t("mods.modOrderTab.modals.modFileModals.categories.archived"),
    OTHER: t("mods.modOrderTab.modals.modFileModals.categories.other"),
  };

  const groups = useMemo(
    () => groupModFilesByCategory(props.data.modFiles.files),
    [props.data],
  );

  return (
    <Modal
      size="xl"
      show={props.isOpen}
      onHide={props.cancel}
      animation={animationsEnabled}
      backdrop="static"
      scrollable
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {t("mods.modOrderTab.modals.pickModFileModal.title")}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          {t("mods.modOrderTab.modals.pickModFileModal.question", {
            modTitle: props.data.modTitle,
          })}
        </p>
        {groups.length === 0 ? (
          <p>{t("mods.modOrderTab.modals.modFileModals.noFiles")}</p>
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
                          "mods.modOrderTab.modals.modFileModals.tableHeaderFile",
                        )}
                      </th>
                      <th>
                        {t(
                          "mods.modOrderTab.modals.modFileModals.tableHeaderVersion",
                        )}
                      </th>
                      <th>
                        {t(
                          "mods.modOrderTab.modals.modFileModals.tableHeaderUploaded",
                        )}
                      </th>
                      <th>
                        {t(
                          "mods.modOrderTab.modals.modFileModals.tableHeaderSize",
                        )}
                      </th>
                      <th>
                        {t(
                          "mods.modOrderTab.modals.modFileModals.tableHeaderActions",
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
                                    "mods.modOrderTab.modals.modFileModals.primaryFile",
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
                            onClick={() => props.close(file)}
                          >
                            {t(
                              "mods.modOrderTab.modals.pickModFileModal.downloadButton",
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
