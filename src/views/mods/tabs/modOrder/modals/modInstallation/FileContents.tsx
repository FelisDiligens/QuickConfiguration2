import { DirEntry } from "@/commands/bindings";
import { FlexRow } from "@/components/common/Flex";
import { clamp } from "@/utils/math";
import { css } from "@emotion/react";
import {
  faChevronDown,
  faChevronRight,
  faFile,
  faFileZipper,
  faFolder,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useId, useMemo, useRef } from "react";
import { Form } from "react-bootstrap";

export type File = Extract<DirEntry, { type: "file" }>;
export type Folder = Extract<DirEntry, { type: "folder" }>;

const indentWidth = 26;
const gapWidth = 8;
const checkBoxWidth = 16;
const expanderButtonWidth = 15;
const nodeIconWidth = 25;
const rowHeight = 26;

export interface FileContentsProps {
  contents: DirEntry[];
  maxHeight: number;
  enabledPaths: Set<string>;
  expandedPaths: Set<string>;
  setEnabledPaths: React.Dispatch<React.SetStateAction<Set<string>>>;
  setExpandedPaths: React.Dispatch<React.SetStateAction<Set<string>>>;
}

interface FlattenedNode {
  key: string;
  label: string;
  icon?: "file" | "file-zipper" | "folder";
  iconColor?: string;
  selectable?: boolean;
  selected?: boolean;
  expandable?: boolean;
  expanded?: boolean;
  indent?: number;
}

/**
 * Displays the given folder contents as a nested tree with collapsable folders
 * and checkboxes to select individual files.
 * @param props Getter and setter for the folder contents.
 */
export default function FileContents(props: FileContentsProps) {
  const parentRef = useRef(null);

  const nodes = useMemo(
    () => flattenTree(props.contents, props.enabledPaths, props.expandedPaths),
    [props.contents, props.enabledPaths, props.expandedPaths],
  );

  const childMap = useMemo(
    () => populateChildMap(props.contents, new Map()),
    [props.contents],
  );

  const height = useMemo(
    () => clamp(nodes.length * rowHeight, 50, props.maxHeight),
    [nodes, props.maxHeight],
  );

  const virtualizer = useVirtualizer({
    count: nodes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
  });

  function setSelected(
    key: string,
    selected: boolean,
    skipReconstructSet?: boolean,
  ) {
    const childKeys = childMap.get(key);
    if (childKeys && childKeys.length > 0) {
      childKeys.forEach((child) => setSelected(child, selected, true));
      if (!skipReconstructSet)
        props.setEnabledPaths(new Set([...props.enabledPaths]));
      return;
    }
    if (selected) {
      props.enabledPaths.add(key);
    } else {
      props.enabledPaths.delete(key);
    }
    if (!skipReconstructSet)
      props.setEnabledPaths(new Set([...props.enabledPaths]));
  }

  function setExpanded(key: string, expanded: boolean) {
    if (expanded) props.expandedPaths.add(key);
    else props.expandedPaths.delete(key);
    props.setExpandedPaths(new Set([...props.expandedPaths]));
  }

  return (
    <div
      ref={parentRef}
      style={{
        height: `${height}px`,
      }}
      css={css`
        overflow: auto;
      `}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
        }}
        css={css`
          width: 100%;
          position: relative;
        `}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
            css={css`
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
            `}
          >
            <TreeNode
              label={nodes[virtualItem.index].label}
              icon={nodes[virtualItem.index].icon}
              iconColor={nodes[virtualItem.index].iconColor}
              selectable={nodes[virtualItem.index].selectable}
              selected={nodes[virtualItem.index].selected}
              expandable={nodes[virtualItem.index].expandable}
              expanded={nodes[virtualItem.index].expanded}
              indent={nodes[virtualItem.index].indent}
              setSelected={
                nodes[virtualItem.index].selectable
                  ? (selected: boolean) =>
                      setSelected(nodes[virtualItem.index].key, selected)
                  : undefined
              }
              setExpanded={
                nodes[virtualItem.index].expandable
                  ? (expanded: boolean) =>
                      setExpanded(nodes[virtualItem.index].key, expanded)
                  : undefined
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function TreeNode(props: {
  label: string;
  icon?: string;
  iconColor?: string;
  selectable?: boolean;
  selected?: boolean;
  expandable?: boolean;
  expanded?: boolean;
  indent?: number;
  setSelected?: (selected: boolean) => void;
  setExpanded?: (expanded: boolean) => void;
}) {
  const id = useId();
  const indent = props.indent || 0;
  let icon;
  switch (props.icon) {
    case "file":
      icon = faFile;
      break;
    case "file-zipper":
      icon = faFileZipper;
      break;
    case "folder":
      icon = faFolder;
      break;
  }

  return (
    <FlexRow
      center
      gap={gapWidth + "px"}
      css={css`margin-left: ${indentWidth * indent}px;`}
    >
      {/* Expand/collapse */}
      {props.expandable && (
        <button
          css={css`
            padding: 0;
            border: none;
            background: none;
            width: ${expanderButtonWidth}px;
            flex-shrink: 0;
          `}
          onClick={() => {
            if (props.setExpanded) props.setExpanded(!props.expanded);
          }}
        >
          {props.expanded ? (
            <FontAwesomeIcon icon={faChevronDown} size="xs" />
          ) : (
            <FontAwesomeIcon icon={faChevronRight} size="xs" />
          )}
        </button>
      )}

      {/* Checkbox, icon, and label */}
      {props.selectable ? (
        <Form.Check
          id={id}
          css={
            !props.expandable &&
            css`margin-left: ${expanderButtonWidth + gapWidth}px;`
          }
        >
          <Form.Check.Input
            checked={props.selected}
            onChange={(ev) => {
              if (props.setSelected) props.setSelected(ev.target.checked);
            }}
          />
          <Form.Check.Label>
            {icon && (
              <FontAwesomeIcon
                icon={icon}
                color={props.iconColor}
                css={css`margin-right: 4px;`}
              />
            )}
            <span css={!icon && css`margin-left: ${nodeIconWidth}px;`}>
              {props.label}
            </span>
          </Form.Check.Label>
        </Form.Check>
      ) : (
        <div css={css`margin-left: ${checkBoxWidth + gapWidth}px;`}>
          {icon && (
            <FontAwesomeIcon
              icon={icon}
              color={props.iconColor}
              css={css`margin-right: 4px;`}
            />
          )}
          <span css={!icon && css`margin-left: ${nodeIconWidth}px;`}>
            {props.label}
          </span>
        </div>
      )}
    </FlexRow>
  );
}

/**
 * Determine if the folder's checkbox should be checked, depending on
 * whether at least one child at any depth is enabled.
 */
function isChildEnabled(entries: DirEntry[], selectedLeafNodes: Set<string>) {
  for (const entry of entries) {
    if (selectedLeafNodes.has(entry.path)) {
      return true;
    } else if (
      entry.type === "folder" &&
      entry.contents.length > 0 &&
      isChildEnabled(entry.contents, selectedLeafNodes)
    ) {
      return true;
    }
  }
  return false;
}

function flattenTree(
  entries: DirEntry[],
  selectedLeafNodes: Set<string>,
  expandedNodes: Set<string>,
  indent?: number,
): FlattenedNode[] {
  let result: FlattenedNode[] = [];
  for (const entry of entries) {
    const isBa2 = entry.type === "file" && entry.name.endsWith(".ba2");
    const flattenedNode: FlattenedNode = {
      key: entry.path,
      label: entry.name,
      icon: isBa2 ? "file-zipper" : entry.type,
      iconColor: entry.type === "folder" ? "#ffa500" : undefined,
      selectable: true,
      selected:
        entry.type === "folder" && entry.contents.length > 0
          ? isChildEnabled(entry.contents, selectedLeafNodes)
          : selectedLeafNodes.has(entry.path),
      expandable: entry.type === "folder" && entry.contents.length > 0,
      expanded: expandedNodes.has(entry.path),
      indent: indent,
    };
    result.push(flattenedNode);
    if (flattenedNode.expandable && flattenedNode.expanded) {
      result = result.concat(
        flattenTree(
          (entry as Folder).contents,
          selectedLeafNodes,
          expandedNodes,
          (indent || 0) + 1,
        ),
      );
    }
  }
  return result;
}

function populateChildMap(entries: DirEntry[], map: Map<string, string[]>) {
  for (const entry of entries) {
    if (entry.type !== "folder" || entry.contents.length == 0) continue;
    map.set(
      entry.path,
      entry.contents.map((child) => child.path),
    );
    populateChildMap(entry.contents, map);
  }
  return map;
}
