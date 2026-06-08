import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useRef } from "react";
import { OverlayTrigger, Popover } from "react-bootstrap";
import { FlexCol } from "./Flex";

interface Props {
  children: React.ReactNode;
  container: React.RefObject<HTMLDivElement | null>;
}

/** An info circle that when hovered, displays a popover with (hopefully) useful information. */
export function InfoOverlayTrigger(props: Props) {
  return (
    <OverlayTrigger
      trigger={["hover", "focus"]}
      placement="auto"
      container={props.container}
      overlay={
        <Popover>
          <Popover.Body>{props.children}</Popover.Body>
        </Popover>
      }
    >
      <FlexCol noShrink>
        <FontAwesomeIcon size="lg" icon={faInfoCircle} />
      </FlexCol>
    </OverlayTrigger>
  );
}

export function useOverlayContainerRef() {
  return useRef<HTMLDivElement>(null);
}
