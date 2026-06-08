import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ListGroup } from "react-bootstrap";
import { FlexCol, FlexRow } from "./Flex";

interface Props {
  title?: string;
  icon?: IconDefinition;
  children?: React.ReactNode;
}

const Title = styled.span`
  display: block;
  font-size: 10pt;
  color: gray;
`;

export default function InfoRow(props: Props) {
  return (
    <ListGroup.Item>
      <FlexRow center gap="14px">
        {props.icon && (
          <FlexCol>
            <FontAwesomeIcon icon={props.icon} size="lg" />
          </FlexCol>
        )}
        <FlexCol
          shrink
          css={css`
          &:hover {
            cursor: default;
          }
        `}
        >
          {props.title && <Title>{props.title}</Title>}
          {props.children}
        </FlexCol>
      </FlexRow>
    </ListGroup.Item>
  );
}
