import { FlexCol } from "@/components/common/Flex";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { modsEventBus } from "@/services/mods";
import { formatBytes } from "@/utils";
import { css } from "@emotion/react";
import {
  faFileCircleMinus,
  faGripVertical,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Dispatch, SetStateAction, useRef } from "react";
import { Button, Table } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { Resource } from "./ResourceListTab";

function ResourceTableRow({ resource }: { resource: Resource }) {
  const { t } = useTranslation();
  return (
    <tr key={resource.name} className="allow-drag" draggable={true}>
      <td className="center">
        <FontAwesomeIcon
          icon={faGripVertical}
          css={css`
            &:hover {
              cursor: grab;
            }
          `}
        />
      </td>
      <td className="expand">
        <FlexCol grow>
          <b>{resource.name}</b>
        </FlexCol>
      </td>
      <td className="center">{resource.modName}</td>
      <td className="center">{formatBytes(resource.fileSize)}</td>
      <td className="center">
        {resource.exists
          ? t("mods.resourceListTab.table.rows.existsYes")
          : t("mods.resourceListTab.table.rows.existsNo")}
      </td>
      <td className="center">
        <Button
          variant="outline-danger"
          size="sm"
          onClick={() =>
            modsEventBus.emitResourcelistRemoveArchive(resource.name)
          }
        >
          <FontAwesomeIcon icon={faFileCircleMinus} />
          &nbsp;{t("mods.resourceListTab.table.rows.removeButton")}
        </Button>
      </td>
    </tr>
  );
}

export default function ResourceTable(props: {
  resources: Resource[];
  setResources: Dispatch<SetStateAction<Resource[]>>;
}) {
  const { t } = useTranslation();
  const dndParentRef = useRef<HTMLTableSectionElement | null>(null);

  useDragAndDrop(props.resources, props.setResources, dndParentRef);

  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        flex-shrink: 1;
        overflow-x: auto;
        padding: 0;
      `}
    >
      <Table
        hover
        size="sm"
        css={css`
          white-space: nowrap;
          & td, & th {
            padding: 5px 10px;
            vertical-align: middle;
          }
          & td.center, & th.center {
            text-align: center;
          }
          & td.expand, & th.expand {
            width: 100%;
          }
          & tr:hover td {
            background-color: var(--bs-table-hover-bg);
          }
        `}
      >
        <thead
          css={css`
            th {
              font-weight: 600;
              font-size: 0.8em;
              opacity: 0.6;
            }
          `}
        >
          <tr>
            <th></th>
            <th className="expand">
              {t("mods.resourceListTab.table.header.archiveName")}
            </th>
            <th className="center">
              {t("mods.resourceListTab.table.header.modName")}
            </th>
            <th className="center">
              {t("mods.resourceListTab.table.header.fileSize")}
            </th>
            <th className="center">
              {t("mods.resourceListTab.table.header.exists")}
            </th>
            <th className="center">
              {t("mods.resourceListTab.table.header.actions")}
            </th>
          </tr>
        </thead>
        <tbody ref={dndParentRef}>
          {props.resources.map((resource) => (
            <ResourceTableRow key={resource.name} resource={resource} />
          ))}
        </tbody>
      </Table>
    </div>
  );
}
