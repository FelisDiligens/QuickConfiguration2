import { FlexCol } from "@/components/common/Flex";
import { AppTheme } from "@/components/MyThemeProvider";
import { css, useTheme as useEmotionTheme } from "@emotion/react";
import { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { MouseEventHandler } from "react";
import { Button, Dropdown } from "react-bootstrap";

export function ToolSeparator() {
  return (
    <div
      css={(theme: AppTheme) => css`
        padding: 0;
        margin: 6px;
        width: 0px;
        border-left: 1px solid ${theme.components.toolbar.separatorColor};
      `}
    />
  );
}

export function ToolButton(props: {
  icon: IconDefinition;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  width?: number;
  variant?: React.ComponentProps<typeof Button>["variant"];
  children: React.ReactNode;
}) {
  const theme: AppTheme = useEmotionTheme();
  const width = props.width || 90;
  return (
    <Button
      variant={props.variant || theme.components.toolbar.buttonVariant}
      onClick={props.onClick}
      css={css`
        width: ${width}px;
        height: 60px;
        padding: 0 3px;
        border: none;
        border-radius: 2px;
      `}
    >
      <FlexCol grow center>
        <FontAwesomeIcon icon={props.icon} size="lg" />
        <div
          css={css`
            font-size: 0.75em;
            line-height: 1.1;
            min-height: 30px;
            display: flex;
            justify-content: center;
            align-items: center;
          `}
        >
          {props.children}
        </div>
      </FlexCol>
    </Button>
  );
}

export function ToolDropdown(props: {
  icon: IconDefinition;
  label: string;
  width?: number;
  children: React.ReactNode;
}) {
  const theme: AppTheme = useEmotionTheme();
  const width = props.width || 90;
  return (
    <Dropdown
      css={css`
        width: ${width}px;
        height: 60px;
        padding: 0;
        position: static;
      `}
    >
      <Dropdown.Toggle
        variant={theme.components.toolbar.buttonVariant}
        css={css`
          padding: 3px 6px;
          width: 100%;
          height: 100%;
          border: none;
          border-radius: 2px;
          position: relative;
          &.dropdown-toggle::after {
            position: absolute;
            top: 50%;
            right: 6px;
          }
        `}
      >
        <FontAwesomeIcon icon={props.icon} size="lg" />
        <div
          css={css`
            font-size: 0.75em;
            line-height: 1.1;
            min-height: 30px;
            display: flex;
            justify-content: center;
            align-items: center;
            white-space: normal;
          `}
        >
          {props.label}
        </div>
      </Dropdown.Toggle>
      <Dropdown.Menu
        css={css`
        `}
      >
        {props.children}
      </Dropdown.Menu>
    </Dropdown>
  );
}

export function Toolbar(props: { children: React.ReactNode }) {
  return (
    <div
      css={(theme: AppTheme) => css`
        display: flex;
        flex-direction: row;
        flex-shrink: 0;
        background-color: ${theme.components.toolbar.backgroundColor};
        padding: 3px 6px;
        gap: 3px;
        flex-wrap: nowrap;
        overflow: auto;
      `}
    >
      {props.children}
    </div>
  );
}
