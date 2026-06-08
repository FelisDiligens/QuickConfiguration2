import { css } from "@emotion/react";
import styled from "@emotion/styled";
import * as React from "react";
import { ListGroup } from "react-bootstrap";
import { FlexCol, FlexRow } from "./Flex";

interface Props {
  title?: string;
  subtitle?: string;
  errorText?: string;
  arrangement?: "lr" | "td";
  children?: React.ReactNode;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  afterTitleSlot?: React.ReactNode;
  onActivate?: (ev: React.MouseEvent) => void;
  ref?: React.Ref<HTMLDivElement>;
}

const SmallTitle = styled.span`
  display: block;
  font-size: 11pt;
  opacity: 0.8;
`;

const Description = styled.span`
  display: block;
  font-size: 10pt;
  color: gray;
`;

const ErrorText = styled.span`
  display: block;
  font-size: 10pt;
  color: var(--bs-danger);
`;

function ActionRowTopDown(props: Props) {
  return (
    <ListGroup.Item
      onClick={(ev) => {
        if (props.onActivate) props.onActivate(ev);
      }}
    >
      <FlexRow ref={props.ref} gap="0.5rem">
        {props.title && (
          <FlexCol
            shrink
            css={css`
              &:hover {
                cursor: default;
              }
            `}
          >
            {props.title && <SmallTitle>{props.title}</SmallTitle>}
            {props.subtitle && <Description>{props.subtitle}</Description>}
            {props.errorText && <ErrorText>{props.errorText}</ErrorText>}
          </FlexCol>
        )}
      </FlexRow>
      <FlexRow gap="0.5rem">
        {props.prefix}
        {props.children && <FlexCol>{props.children}</FlexCol>}
        {props.afterTitleSlot}
        {props.suffix}
      </FlexRow>
    </ListGroup.Item>
  );
}

function ActionRowLeftRight(props: Props) {
  return (
    <ListGroup.Item
      onClick={(ev) => {
        if (props.onActivate) props.onActivate(ev);
      }}
    >
      <FlexRow center ref={props.ref} gap="1rem">
        {props.prefix}
        {props.title && (
          <FlexCol
            fullWidth
            shrink
            css={css`
              &:hover {
                cursor: default;
              }
            `}
          >
            {props.title}
            {props.subtitle && <Description>{props.subtitle}</Description>}
            {props.errorText && <ErrorText>{props.errorText}</ErrorText>}
          </FlexCol>
        )}
        {props.afterTitleSlot}
        {props.title && (
          <FlexCol grow>{/* Empty Col to take up remaining space */}</FlexCol>
        )}
        {props.children && <FlexCol noShrink>{props.children}</FlexCol>}
        {props.suffix}
      </FlexRow>
    </ListGroup.Item>
  );
}

export default function ActionRow(props: Props) {
  if (props.arrangement === "td") return <ActionRowTopDown {...props} />;
  return <ActionRowLeftRight {...props} />;
}
