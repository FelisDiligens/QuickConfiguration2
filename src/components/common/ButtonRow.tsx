import { css } from "@emotion/react";
import * as React from "react";
import { ListGroup } from "react-bootstrap";
import { FlexCol, FlexRow } from "./Flex";

interface Props {
  children?: React.ReactNode;
  /** Whether to align the button label in the center or left. */
  center?: boolean;
  iconRight?: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
  onClick?: (ev: React.UIEvent) => void;
  ref?: React.Ref<HTMLDivElement>;
  disabled?: boolean;
}

const styles = (
  variant: NonNullable<Props["variant"]>,
  disabled: boolean,
) => css`
  padding: 14px 16px;
  font-weight: 500;
  transition: background-color 0.1s ease-out;

  & > .row {
    flex-wrap: nowrap;
    justify-content: center;
  }

  ${
    !disabled &&
    css`
      &:hover {
        cursor: pointer;
        background-color: var(--bs-${variant}-bg-subtle);
      }

      &:active {
        background-color: var(--bs-primary-bg);
      }
    `
  }
`;

export default function ButtonRow(props: Props) {
  const variant = props.variant || "secondary";

  const handleClick = (ev: React.MouseEvent | React.KeyboardEvent) => {
    if (!props.disabled && props.onClick) props.onClick(ev as React.UIEvent);
  };

  const handleKeyDown = (ev: React.KeyboardEvent) => {
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      handleClick(ev);
    }
  };

  return (
    <ListGroup.Item
      css={styles(variant, props.disabled || false)}
      role="button"
      tabIndex={props.disabled ? -1 : 0}
      aria-disabled={props.disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <FlexRow center ref={props.ref}>
        {props.children && (
          <FlexCol center={props.center} grow noShrink>
            <FlexRow center>{props.children}</FlexRow>
          </FlexCol>
        )}
        {props.iconRight && (
          <FlexCol
            css={css`
              align-items: end;
              margin-right: 0px;
            `}
          >
            {props.iconRight}
          </FlexCol>
        )}
      </FlexRow>
    </ListGroup.Item>
  );
}
