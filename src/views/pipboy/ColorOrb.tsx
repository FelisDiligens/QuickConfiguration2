import { css } from "@emotion/react";
import { RefObject } from "react";
import { OverlayTrigger, Popover } from "react-bootstrap";

interface Props {
  color: string;
  name: string;
  description: string;
  onClick: (color: string) => void;
  overlayContainer?: RefObject<HTMLDivElement | null>;
}

export default function ColorOrb(props: Props) {
  const handleClick = () => {
    props.onClick(props.color);
  };

  const handleKeyDown = (ev: React.KeyboardEvent) => {
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      handleClick();
    }
  };

  return (
    <OverlayTrigger
      trigger={["hover", "focus"]}
      placement="top"
      container={props.overlayContainer}
      overlay={
        <Popover>
          <Popover.Header>{props.name}</Popover.Header>
          <Popover.Body>
            {props.description}
            <br />
            <code>{props.color}</code>
          </Popover.Body>
        </Popover>
      }
    >
      <div
        role="button"
        onClick={() => props.onClick(props.color)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        css={css`
          display: inline-block;
          margin-right: 10px;
          width: 32px;
          height: 32px;
          background-color: ${props.color};
          border-radius: 100%;
          cursor: pointer;
          &:hover {
            border: 2px solid white;
          }
        `}
      ></div>
    </OverlayTrigger>
  );
}
