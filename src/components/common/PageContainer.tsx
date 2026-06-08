import { css } from "@emotion/react";
import { FlexContainer } from "./Flex";

interface Props {
  noMargin?: boolean;
  children: React.ReactNode;
}

export default function PageContainer(props: Props) {
  return (
    <FlexContainer
      noChildShrink
      css={css`
        overflow-y: auto;
        padding: ${props.noMargin ? "0" : "0 12px"};
      `}
    >
      {props.children}
    </FlexContainer>
  );
}
