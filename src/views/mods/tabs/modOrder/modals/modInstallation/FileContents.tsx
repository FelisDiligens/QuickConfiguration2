import { DirEntry } from "@/commands/bindings";
import { FlexRow } from "@/components/common/Flex";
import { getPathSep, pathJoinSync } from "@/utils";
import { css } from "@emotion/react";
import {
  faChevronDown,
  faChevronRight,
  faFile,
  faFileZipper,
  faFolder,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { createContext, useContext, useId, useMemo } from "react";
import { Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";

export type File = Extract<DirEntry, { type: "file" }>;
export type Folder = Extract<DirEntry, { type: "folder" }>;

export interface FileProps extends Omit<File, "type"> {
  indent?: number;
}

export interface FolderProps extends Omit<Folder, "type"> {
  indent?: number;
  root?: boolean;
}

const indentWidth = 26;
const gapWidth = 8;
const checkBoxWidth = 16;
const expanderButtonWidth = 15;

export function FileComponent(props: FileProps) {
  const id = useId();
  const { enabledPaths, setEnabledPath } = useContext(FileContentsContext);
  const indent = props.indent || 0;
  const enabled = enabledPaths.has(props.path);

  let icon = faFile;
  if (props.name.endsWith(".ba2")) {
    icon = faFileZipper;
  }

  return (
    <FlexRow
      center
      gap={gapWidth + "px"}
      css={css`margin-left: ${expanderButtonWidth + gapWidth + indentWidth * indent}px;`}
    >
      {/* Checkbox, icon, and label */}
      <Form.Check id={id}>
        <Form.Check.Input
          checked={enabled}
          onChange={(ev) => setEnabledPath(props.path, ev.target.checked)}
        />
        <Form.Check.Label>
          <FontAwesomeIcon
            icon={icon}
            css={css`
              opacity: 0.7;
              margin-right: 4px;
            `}
          />
          <span>{props.name}</span>
        </Form.Check.Label>
      </Form.Check>
    </FlexRow>
  );
}

export function FolderComponent(props: FolderProps) {
  const { t } = useTranslation();
  const id = useId();
  const indent = props.indent || 0;
  const { enabledPaths, setEnabledPath, expandedPaths, setExpandedPath } =
    useContext(FileContentsContext);
  const expanded = expandedPaths.has(props.path);

  // Determine if the folder's checkbox should be checked, depending on
  // whether at least one child at any depth is enabled:
  const isChildEnabled = () => {
    const pathSep = getPathSep();
    const path = props.path.endsWith(pathSep)
      ? props.path
      : props.path + pathSep;
    for (const childPath of enabledPaths) {
      if (childPath.startsWith(path)) {
        return true;
      }
    }
    return false;
  };
  const enabled = useMemo(() => isChildEnabled(), [enabledPaths]);

  // Determine if the folder is empty:
  const empty = props.contents.length == 0;

  // Enable all child files,
  // recursively iterates over every child folder's contents:
  const recursivelySetEnabledOnAllChildren = (
    contents: DirEntry[],
    enabled: boolean,
  ) => {
    for (const child of contents) {
      if (child.type === "folder") {
        recursivelySetEnabledOnAllChildren(child.contents, enabled);
      } else {
        setEnabledPath(child.path, enabled);
      }
    }
  };

  const children = props.contents.map((child) => {
    const path = pathJoinSync(props.path, child.name);
    return child.type === "folder" ? (
      <FolderComponent
        {...child}
        key={path}
        path={path}
        indent={props.root ? 0 : indent + 1}
      />
    ) : (
      <FileComponent
        {...child}
        key={path}
        path={path}
        indent={props.root ? 0 : indent + 1}
      />
    );
  });

  // If this folder is set as "root",
  // only show it's children and set their indentation to 0:
  if (props.root) {
    return empty ? <p>{t("common.noContent")}</p> : <>{children}</>;
  }

  if (empty) {
    return (
      <FlexRow
        center
        css={css`margin-left: ${expanderButtonWidth + checkBoxWidth + gapWidth * 2 + indentWidth * indent}px;`}
      >
        <FontAwesomeIcon
          icon={faFolder}
          color="#ffa500"
          css={css`margin-right: 4px;`}
        />
        <span>{props.name}</span>
      </FlexRow>
    );
  }

  return (
    <>
      <FlexRow
        center
        gap={gapWidth + "px"}
        css={css`margin-left: ${indentWidth * indent}px;`}
      >
        {/* Expand/collapse */}
        <button
          css={css`
            padding: 0;
            border: none;
            background: none;
            width: ${expanderButtonWidth}px;
            flex-shrink: 0;
          `}
          onClick={() => setExpandedPath(props.path, !expanded)}
        >
          {expanded ? (
            <FontAwesomeIcon icon={faChevronDown} size="xs" />
          ) : (
            <FontAwesomeIcon icon={faChevronRight} size="xs" />
          )}
        </button>

        {/* Checkbox, icon, and label */}
        <Form.Check id={id}>
          <Form.Check.Input
            checked={enabled}
            onChange={(ev) =>
              recursivelySetEnabledOnAllChildren(
                props.contents,
                ev.target.checked,
              )
            }
          />
          <Form.Check.Label>
            <FontAwesomeIcon
              icon={faFolder}
              color="#ffa500"
              css={css`margin-right: 4px;`}
            />
            <span>{props.name}</span>
          </Form.Check.Label>
        </Form.Check>
      </FlexRow>

      {/* Show all children with their indentation incremented underneath */}
      {expanded && children}
    </>
  );
}

export interface FileContentsProps {
  contents: DirEntry[];
  enabledPaths: Set<string>;
  expandedPaths: Set<string>;
  setContents: React.Dispatch<React.SetStateAction<DirEntry[]>>;
  setEnabledPaths: React.Dispatch<React.SetStateAction<Set<string>>>;
  setExpandedPaths: React.Dispatch<React.SetStateAction<Set<string>>>;
}

const FileContentsContext = createContext({
  enabledPaths: new Set<string>(),
  setEnabledPath: (_path: string, _enabled: boolean) => {
    console.log("Context not initialized");
  },
  expandedPaths: new Set<string>(),
  setExpandedPath: (_path: string, _expanded: boolean) => {
    console.log("Context not initialized");
  },
});

/**
 * Displays the given folder contents as a nested tree with collapsable folders
 * and checkboxes to select individual files.
 * @param props Getter and setter for the folder contents.
 */
export default function FileContents(props: FileContentsProps) {
  const setExpandedPath = (path: string, expanded: boolean) => {
    props.setExpandedPaths((expandedPaths) => {
      if (expanded) {
        return new Set([...expandedPaths, path]);
      } else {
        return new Set(
          [...expandedPaths].filter((thisPath) => path != thisPath),
        );
      }
    });
  };
  const setEnabledPath = (path: string, enabled: boolean) => {
    props.setEnabledPaths((enabledPaths) => {
      if (enabled) {
        return new Set([...enabledPaths, path]);
      } else {
        return new Set(
          [...enabledPaths].filter((thisPath) => path != thisPath),
        );
      }
    });
  };
  return (
    <FileContentsContext
      value={{
        enabledPaths: props.enabledPaths,
        setEnabledPath,
        expandedPaths: props.expandedPaths,
        setExpandedPath,
      }}
    >
      <FolderComponent
        root={true}
        path="."
        name="."
        contents={props.contents}
      />
    </FileContentsContext>
  );
}
