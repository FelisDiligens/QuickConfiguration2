import { css } from "@emotion/react";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as React from "react";
import { useMemo, useState } from "react";
import { ListGroup } from "react-bootstrap";
import { FlexCol, FlexRow } from "./Flex";

interface Props {
  children: React.ReactNode;
  label?: string;
  collapsedLabel?: string;
  expandedLabel?: string;
  ref?: React.Ref<HTMLDivElement>;
}

const styles = css`
  padding: 14px 16px;
  font-weight: 500;
  transition: background-color 0.1s ease-out;

  & > .row {
    flex-wrap: nowrap;
    justify-content: center;
  }

  &:hover {
    cursor: pointer;
    background-color: var(--bs-secondary-bg-subtle);
  }

  &:active {
    background-color: var(--bs-primary-bg);
  }
`;

export default function AccordionRow(props: Props) {
  const [expanded, setExpanded] = useState(false);
  const label = useMemo(() => {
    if (expanded && props.expandedLabel) return props.expandedLabel;
    else if (!expanded && props.collapsedLabel) return props.collapsedLabel;
    else return props.label;
  }, [expanded, props.label, props.expandedLabel, props.collapsedLabel]);

  const handleClick = (_ev: React.MouseEvent | React.KeyboardEvent) => {
    setExpanded((expanded) => !expanded);
  };

  const handleKeyDown = (ev: React.KeyboardEvent) => {
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      handleClick(ev);
    }
  };

  return (
    <>
      {expanded && props.children}
      <ListGroup.Item
        css={styles}
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        <FlexRow center ref={props.ref}>
          <FlexCol grow noShrink>
            <FlexRow center>{label}</FlexRow>
          </FlexCol>
          <FlexCol
            css={css`
              align-items: end;
              margin-right: 0px;
            `}
          >
            {expanded ? (
              <FontAwesomeIcon icon={faChevronUp} />
            ) : (
              <FontAwesomeIcon icon={faChevronDown} />
            )}
          </FlexCol>
        </FlexRow>
      </ListGroup.Item>
    </>
  );
}
