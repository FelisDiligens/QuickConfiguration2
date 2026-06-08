import { css } from "@emotion/react";
import _ from "lodash";
import { Form } from "react-bootstrap";
import ActionRow from "./ActionRow";
import { FlexCol } from "./Flex";
import Slider from "./Slider";

interface Props {
  title: string;
  subtitle?: string;
  value: number;
  max: number;
  min: number;
  step?: number;
  onChange?: (value: number) => void;
  afterTitleSlot?: React.ReactNode;
}

export default function SliderRow(props: Props) {
  return (
    <ActionRow
      title={props.title}
      subtitle={props.subtitle}
      afterTitleSlot={props.afterTitleSlot}
      suffix={
        <>
          <FlexCol shrink fullWidth>
            <Slider
              value={_.isFinite(props.value) ? props.value : 0}
              max={props.max}
              min={props.min}
              step={props.step}
              css={css`
                min-width: 250px;
              `}
              onChange={props.onChange}
            />
          </FlexCol>
          <FlexCol noGrow>
            <Form.Control
              type="number"
              value={props.value}
              max={props.max}
              min={props.min}
              step={props.step}
              css={css`
                width: 100px;
              `}
              onChange={(ev) => {
                if (props.onChange) props.onChange(parseFloat(ev.target.value));
              }}
            />
          </FlexCol>
        </>
      }
    />
  );
}
