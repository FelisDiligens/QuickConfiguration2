import { AppTheme } from "@/components/MyThemeProvider";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import * as React from "react";
import { Card, ListGroup } from "react-bootstrap";

interface Props {
  title?: string;
  subtitle?: string;
  noShadow?: boolean;
  children: React.ReactNode;
  ref?: React.Ref<HTMLDivElement>;
}

const CardTitle = styled.h4`
  margin: 20px auto 10px auto;
  max-width: ${(props) => props.theme.card.maxWidth};
  font-weight: bold;
  font-size: 12pt;
`;

const CardSubtitle = styled.p`
  margin: 0 auto;
  margin-top: -5px;
  margin-bottom: 10px;
  max-width: ${(props) => props.theme.card.maxWidth};
  font-size: 10pt;
  color: gray;
`;

export function PreferencesCard(props: Props) {
  return (
    <div ref={props.ref} css={css`width: 100%;`}>
      {props.title && <CardTitle>{props.title}</CardTitle>}
      {props.subtitle && <CardSubtitle>{props.subtitle}</CardSubtitle>}
      <Card
        css={(theme: AppTheme) => css`
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 10px;
          margin: 0 auto 30px auto;
          border: none;
          background-color: ${theme.card.backgroundColor};
          border-bottom: 1px solid ${theme.card.borderColor};
          ${!props.noShadow && css`box-shadow: 0px 2px 4px ${theme.card.shadowColor};`}
        `}
      >
        {props.children}
      </Card>
    </div>
  );
}

export default function PreferencesGroup(props: Props) {
  return (
    <div ref={props.ref} css={css`width: 100%;`}>
      {props.title && <CardTitle>{props.title}</CardTitle>}
      {props.subtitle && <CardSubtitle>{props.subtitle}</CardSubtitle>}
      <Card
        css={(theme: AppTheme) => css`
          margin: 0 auto 30px auto;
          max-width: ${theme.card.maxWidth};
          border: none;
          ${!props.noShadow && css`box-shadow: 0px 2px 4px ${theme.card.shadowColor};`}
          & .list-group-item {
            background-color: ${theme.card.backgroundColor};
            border-bottom: 1px solid ${theme.card.borderColor};
            & > .row {
              align-items: center;
            }
          }
        `}
      >
        <ListGroup variant="flush">{props.children}</ListGroup>
      </Card>
    </div>
  );
}
