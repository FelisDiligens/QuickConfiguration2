import {
  ManagedMod,
  ModInstallationState,
  NexusModsModInfo,
} from "@/commands/bindings";
import Entry from "@/components/common/Entry";
import { FlexCol, FlexRow } from "@/components/common/Flex";
import useModinfos from "@/hooks/nexusmods/useModinfos";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { modsEventBus } from "@/services/mods";
import { useModsStore } from "@/stores/mods";
import { useSettingsStore } from "@/stores/settings";
import { css } from "@emotion/react";
import {
  faGripVertical,
  faSearch,
  faTrash,
  faX,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { useMemo, useRef, useState } from "react";
import { Button, Form, InputGroup, Table } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { getModInfo } from "./utils/getModInfo";

function ModTableRow(props: {
  mod: ManagedMod;
  state?: ModInstallationState;
  modinfo?: NexusModsModInfo;
  selected: boolean;
  showNexusModsTitle: boolean;
  onEnable: () => void;
  onDisable: () => void;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();

  // TODO: Cleanup
  const modName =
    props.showNexusModsTitle && props.modinfo?.name
      ? props.modinfo.name
      : props.mod.title;
  const isOutdated =
    !!props.modinfo?.version && props.mod.version !== props.modinfo?.version;
  let needsDeployment = false;
  let status = t("mods.modOrderTab.table.rows.status.enabled");
  if (props.mod.enabled && props.state) {
    if (props.mod.options.rootFolder !== props.state.rootFolder) {
      needsDeployment = true;
      status = t("mods.modOrderTab.table.rows.status.redeployPending");
    }
  }
  if (props.mod.enabled && !props.state) {
    status = t("mods.modOrderTab.table.rows.status.deployPending");
    needsDeployment = true;
  }
  if (!props.mod.enabled && props.state) {
    status = t("mods.modOrderTab.table.rows.status.removePending");
    needsDeployment = true;
  }
  if (!props.mod.enabled && !props.state)
    status = t("mods.modOrderTab.table.rows.status.disabled");
  const rootFolder = props.mod.options.rootFolder || ".";
  const endorsed =
    props.modinfo?.endorseStatus === "Endorsed"
      ? t("mods.modOrderTab.table.rows.endorsedYes")
      : props.modinfo?.endorseStatus
        ? t("mods.modOrderTab.table.rows.endorsedNo")
        : "-/-";

  return (
    <tr
      key={props.mod.key}
      className={classNames(
        {
          selected: props.selected,
        },
        "allow-drag",
      )}
      draggable={true}
    >
      <td className="center" css={css`padding: 0 !important;`}>
        <FontAwesomeIcon
          icon={faGripVertical}
          className="drag-handle"
          css={css`
            padding: 5px 10px 2px;

            &:hover {
              cursor: grab;
            }
          `}
        />
      </td>
      <td className="center">
        <Form.Check
          checked={props.mod.enabled}
          onChange={(ev) => {
            if (ev.target.checked) {
              props.onEnable();
            } else {
              props.onDisable();
            }
          }}
        />
      </td>
      <td
        className="expand"
        onClick={props.onSelect}
        css={css`
          &:hover {
            text-decoration: underline;
            cursor: pointer;
          }
        `}
      >
        <FlexCol grow>
          <div>
            <b>{modName}</b>
          </div>
          {props.modinfo?.author && (
            <div>
              {t("mods.modOrderTab.table.rows.byAuthor", {
                author: props.modinfo.author,
              })}
            </div>
          )}
        </FlexCol>
      </td>
      <td className="center">
        <div>{props.mod.version}</div>
        {props.modinfo?.version && isOutdated && (
          <div
            css={css`
              font-size: 0.8em;
              font-weight: 600;
              color: var(--bs-danger) !important;
            `}
          >
            ({props.modinfo.version})
          </div>
        )}
      </td>
      <td
        className="center"
        css={{
          /*
           * - Needs deployment: Orange, normal
           * - Enabled: Black, normal
           * - Disabled: Gray, italic
           */
          color: needsDeployment
            ? "var(--bs-warning) !important"
            : props.mod.enabled
              ? undefined
              : "gray !important",
          fontStyle:
            !needsDeployment && !props.mod.enabled ? "italic" : undefined,
        }}
      >
        {status}
      </td>
      <td className="center">
        <code>{rootFolder}</code>
      </td>
      <td className="center">{endorsed}</td>
      <td className="center">
        <Button variant="outline-danger" size="sm" onClick={props.onDelete}>
          <FontAwesomeIcon icon={faTrash} />
          &nbsp;{t("mods.modOrderTab.table.rows.deleteButton")}
        </Button>
      </td>
    </tr>
  );
}

export default function ModTable() {
  const { t } = useTranslation();

  const mods = useModsStore((store) => store.mods);
  const getModState = useModsStore((store) => store.getModState);
  const setMods = useModsStore((store) => store.setMods);
  const enableMod = useModsStore((store) => store.enableMod);
  const disableMod = useModsStore((store) => store.disableMod);
  const disableAllMods = useModsStore((store) => store.disableAllMods);
  const selectedModKey = useModsStore((store) => store.selectedModKey);
  const selectModByKey = useModsStore((store) => store.selectModByKey);

  const showNexusModsTitle = useSettingsStore(
    (store) => store.modManager.showNexusModsTitle,
  );

  const enabledModCount = useMemo(
    () => mods?.filter((mod) => mod.enabled)?.length || 0,
    [mods],
  );

  const { modinfos } = useModinfos();

  const [filter, setFilter] = useState("");
  const filteredMods = useMemo(
    () =>
      mods.filter((mod) =>
        mod.title.toLocaleLowerCase().includes(filter.toLocaleLowerCase()),
      ),
    [mods, filter],
  );

  // Drag and drop:
  const dndParentRef = useRef<HTMLTableSectionElement | null>(null);
  useDragAndDrop(mods, setMods, dndParentRef, {
    dragHandle: ".drag-handle",
    disabled: !!filter,
  });

  return (
    <FlexCol grow css={css`overflow-x: auto;`}>
      <FlexRow
        fullWidth
        center
        gap="5px"
        css={css`
          padding: 5px;
          & input {
            font-size: 0.8em;
          }
        `}
      >
        {/* Search row */}
        <FlexCol css={css`padding: 0 8px;`}>
          <FontAwesomeIcon icon={faSearch} />
        </FlexCol>
        <InputGroup>
          <Entry
            value={filter}
            onChange={setFilter}
            placeholder={t("mods.modOrderTab.searchForMod")}
          />
          {filter && (
            <Button variant="outline-danger" onClick={() => setFilter("")}>
              <FontAwesomeIcon icon={faX} />
            </Button>
          )}
        </InputGroup>
      </FlexRow>
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
          & tr:hover td, & tr.selected td {
            background-color: var(--bs-table-hover-bg);
          }
        `}
      >
        <thead
          css={css`
            th:nth-of-type(n+3) {
              font-weight: 600;
              font-size: 0.8em;
              opacity: 0.6;
            }
          `}
        >
          <tr>
            <th></th>
            <th>
              <Form.Check
                checked={enabledModCount > 0}
                onChange={(ev) => {
                  if (ev.target.checked) {
                    for (const mod of filteredMods) {
                      enableMod(mod.key);
                    }
                  } else {
                    disableAllMods();
                  }
                }}
              />
            </th>
            <th className="expand">
              {t("mods.modOrderTab.table.header.modName")}
            </th>
            <th className="center">
              {t("mods.modOrderTab.table.header.version")}
            </th>
            <th className="center">
              {t("mods.modOrderTab.table.header.status")}
            </th>
            <th className="center">
              {t("mods.modOrderTab.table.header.rootFolder")}
            </th>
            <th className="center">
              {t("mods.modOrderTab.table.header.endorsed")}
            </th>
            <th className="center">
              {t("mods.modOrderTab.table.header.actions")}
            </th>
          </tr>
        </thead>
        <tbody ref={dndParentRef}>
          {filteredMods.map((mod) => (
            <ModTableRow
              key={mod.key}
              mod={mod}
              state={getModState(mod.key)}
              modinfo={getModInfo(mod, modinfos)}
              selected={selectedModKey === mod.key}
              showNexusModsTitle={showNexusModsTitle}
              onEnable={() => enableMod(mod.key)}
              onDisable={() => disableMod(mod.key)}
              onSelect={() => selectModByKey(mod.key)}
              onDelete={() => modsEventBus.emitDeleteMod(mod.key)}
            />
          ))}
        </tbody>
      </Table>
    </FlexCol>
  );
}
