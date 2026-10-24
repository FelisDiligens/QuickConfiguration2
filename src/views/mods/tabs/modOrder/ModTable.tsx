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
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Form, InputGroup, Table } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { getModInfo } from "./utils/getModInfo";

function ModTableRow(props: {
  mod: ManagedMod;
  state?: ModInstallationState;
  modinfo?: NexusModsModInfo;
  selected: boolean;
  focused: boolean;
  showNexusModsTitle: boolean;
  onEnable: () => void;
  onDisable: () => void;
  onSelect: () => void;
  onDelete: () => void;
  onFocusRow: () => void;
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
  let endorsement;
  switch (props.modinfo?.endorseStatus) {
    case "Endorsed":
      endorsement = t("mods.modOrderTab.table.rows.endorsed");
      break;
    case "Abstained":
      endorsement = t("mods.modOrderTab.table.rows.abstained");
      break;
    case "Undecided":
      endorsement = t("mods.modOrderTab.table.rows.undecided");
      break;
    default:
      endorsement = "-/-";
      break;
  }

  return (
    <tr
      key={props.mod.key}
      className={classNames(
        {
          selected: props.selected,
        },
        "allow-drag",
      )}
      data-mod-key={props.mod.key}
      tabIndex={props.focused ? 0 : -1}
      aria-selected={props.selected}
      draggable={true}
      onFocus={props.onFocusRow}
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
      <td
        className="center"
        css={{
          /*
           * - Endorsed: green
           * - Abstained: red
           * - Undecided: inherit
           * - Undefined: gray
           */
          color:
            props.modinfo?.endorseStatus === "Endorsed"
              ? "var(--bs-success) !important"
              : props.modinfo?.endorseStatus === "Abstained"
                ? "var(--bs-danger) !important"
                : props.modinfo?.endorseStatus === "Undecided"
                  ? "inherit"
                  : "gray !important",
          fontStyle:
            !needsDeployment && !props.mod.enabled ? "italic" : undefined,
        }}
      >
        {endorsement}
      </td>
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
  const moveModUp = useModsStore((store) => store.moveModUp);
  const moveModDown = useModsStore((store) => store.moveModDown);
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

  const [focusedModKey, setFocusedModKey] = useState<string | undefined>();
  const [pendingFocusModKey, setPendingFocusModKey] = useState<
    string | undefined
  >();
  const [announcement, setAnnouncement] = useState("");

  const focusModKey = (modKey: string) => {
    setFocusedModKey(modKey);
    const row = Array.from(
      dndParentRef.current?.querySelectorAll<HTMLTableRowElement>(
        "tr[data-mod-key]",
      ) ?? [],
    ).find((row) => row.dataset.modKey === modKey);
    row?.focus();
  };

  useEffect(() => {
    if (!pendingFocusModKey) return;
    setPendingFocusModKey(undefined);
    focusModKey(pendingFocusModKey);
  }, [pendingFocusModKey, mods]);

  const rovingModKey =
    focusedModKey && filteredMods.some((mod) => mod.key === focusedModKey)
      ? focusedModKey
      : filteredMods.at(0)?.key;

  const moveRow = (mod: ManagedMod, offset: number) => {
    if (offset < 0) {
      moveModUp(mod.key);
      setAnnouncement(
        t("mods.modOrderTab.table.aria.modMovedUp", { title: mod.title }),
      );
    } else {
      moveModDown(mod.key);
      setAnnouncement(
        t("mods.modOrderTab.table.aria.modMovedDown", { title: mod.title }),
      );
    }
    setPendingFocusModKey(mod.key);
  };

  const handleTabKeyDown = (
    ev: React.KeyboardEvent<HTMLTableSectionElement>,
  ) => {
    if (!(ev.target instanceof HTMLElement)) return;
    const row = ev.target.closest("tr[data-mod-key]");
    if (!(row instanceof HTMLTableRowElement)) return;
    const modKey = row.dataset.modKey;
    if (!modKey) return;
    const visibleIndex = filteredMods.findIndex((mod) => mod.key === modKey);
    if (visibleIndex < 0) return;

    if (ev.target instanceof HTMLButtonElement && !ev.shiftKey) {
      const nextMod = filteredMods.at(visibleIndex + 1);
      if (nextMod) {
        ev.preventDefault();
        focusModKey(nextMod.key);
      }
      return;
    }

    if (ev.target instanceof HTMLInputElement && ev.shiftKey) {
      ev.preventDefault();
      focusModKey(modKey);
    }
  };

  const handleKeyDown = (ev: React.KeyboardEvent<HTMLTableSectionElement>) => {
    if (ev.key === "Tab") handleTabKeyDown(ev);
    if (!(ev.target instanceof HTMLTableRowElement)) return;
    const modKey = ev.target.dataset.modKey;
    if (!modKey) return;
    const visibleIndex = filteredMods.findIndex((mod) => mod.key === modKey);
    const mod = filteredMods.at(visibleIndex);
    if (!mod) return;

    if (ev.key === "ArrowUp" || ev.key === "ArrowDown") {
      const offset = ev.key === "ArrowUp" ? -1 : 1;
      if (ev.altKey && filter) return;
      ev.preventDefault();
      if (ev.altKey) {
        moveRow(mod, offset);
      } else {
        const nextMod = filteredMods.at(visibleIndex + offset);
        if (nextMod) focusModKey(nextMod.key);
      }
      return;
    }

    if (ev.key === "Home" || ev.key === "End") {
      ev.preventDefault();
      const targetMod =
        ev.key === "Home" ? filteredMods.at(0) : filteredMods.at(-1);
      if (targetMod) focusModKey(targetMod.key);
      return;
    }

    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      selectModByKey(modKey);
      return;
    }

    if (ev.key === "Delete" || ev.key === "Backspace") {
      ev.preventDefault();
      modsEventBus.emitDeleteMod(modKey);
    }
  };

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
      <span aria-live="polite" className="visually-hidden">
        {announcement}
      </span>
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
          & tr:focus-visible {
            outline: none;
          }
          & tr:focus-visible td {
            box-shadow: inset 0 2px 0 0 var(--bs-primary),
              inset 0 -2px 0 0 var(--bs-primary);
          }
          & tr:focus-visible td:first-of-type {
            box-shadow: inset 2px 0 0 0 var(--bs-primary),
              inset 0 2px 0 0 var(--bs-primary),
              inset 0 -2px 0 0 var(--bs-primary);
          }
          & tr:focus-visible td:last-of-type {
            box-shadow: inset -2px 0 0 0 var(--bs-primary),
              inset 0 2px 0 0 var(--bs-primary),
              inset 0 -2px 0 0 var(--bs-primary);
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
              {t("mods.modOrderTab.table.header.endorsement")}
            </th>
            <th className="center">
              {t("mods.modOrderTab.table.header.actions")}
            </th>
          </tr>
        </thead>
        <tbody ref={dndParentRef} onKeyDown={handleKeyDown}>
          {filteredMods.map((mod) => (
            <ModTableRow
              key={mod.key}
              mod={mod}
              state={getModState(mod.key)}
              modinfo={getModInfo(mod, modinfos)}
              selected={selectedModKey === mod.key}
              focused={mod.key === rovingModKey}
              showNexusModsTitle={showNexusModsTitle}
              onEnable={() => enableMod(mod.key)}
              onDisable={() => disableMod(mod.key)}
              onSelect={() => selectModByKey(mod.key)}
              onDelete={() => modsEventBus.emitDeleteMod(mod.key)}
              onFocusRow={() => setFocusedModKey(mod.key)}
            />
          ))}
        </tbody>
      </Table>
    </FlexCol>
  );
}
