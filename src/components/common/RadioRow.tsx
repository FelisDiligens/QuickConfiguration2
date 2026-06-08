import { css } from "@emotion/react";
import { useContext, useRef } from "react";
import { Form } from "react-bootstrap";
import ActionRow from "./ActionRow";
import { FlexCol } from "./Flex";
import { RadioRowGroupContext } from "./RadioRowGroup";

interface Props {
  title: string;
  subtitle?: string;
  imageSrc?: string;
  id: string;
  afterTitleSlot?: React.ReactNode;
}

export default function RadioRow(props: Props) {
  const radioRef = useRef<HTMLInputElement | null>(null);
  const radioGroupCtx = useContext(RadioRowGroupContext);
  return (
    <ActionRow
      title={props.title}
      subtitle={props.subtitle}
      afterTitleSlot={props.afterTitleSlot}
      onActivate={() => {
        if (radioRef.current) radioRef.current.click();
      }}
      prefix={
        <>
          <FlexCol noGrow>
            <Form.Check
              id={props.id}
              name={radioGroupCtx.name}
              checked={props.id == radioGroupCtx.value}
              onChange={(ev) => {
                if (ev.currentTarget.checked && radioGroupCtx.onChange)
                  radioGroupCtx.onChange(props.id);
              }}
              type="radio"
              ref={radioRef}
            />
          </FlexCol>
          {props.imageSrc && (
            <FlexCol noGrow css={css`padding-left: 5px;`}>
              <img src={props.imageSrc} />
            </FlexCol>
          )}
        </>
      }
    />
  );
}
