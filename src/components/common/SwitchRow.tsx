import { css } from "@emotion/react";
import { useRef } from "react";
import { FormCheck } from "react-bootstrap";
import ActionRow from "./ActionRow";

interface Props {
  title: string;
  subtitle?: string;
  errorText?: string;
  checked?: boolean;
  disabled?: boolean;
  afterTitleSlot?: React.ReactNode;
  onChange?: (value: boolean) => void;
}

const bigSwitchStyle = css`
  .form-check-input {
    height: 1.5rem;
    width: calc(2rem + 0.75rem);
    border-radius: 3rem;
  }
`;

export default function SwitchRow(props: Props) {
  const ref = useRef<HTMLInputElement | null>(null);
  function onActivate(ev: React.MouseEvent) {
    if (props.disabled) return;
    if (ref.current && !(ev.target instanceof HTMLInputElement)) {
      ref.current.click();
    }
  }
  return (
    <ActionRow
      title={props.title}
      subtitle={props.subtitle}
      errorText={props.errorText}
      onActivate={onActivate}
      afterTitleSlot={props.afterTitleSlot}
    >
      <FormCheck
        type="switch"
        checked={props.checked}
        disabled={props.disabled}
        onChange={(ev) => {
          if (props.onChange) {
            props.onChange(ev.currentTarget.checked);
          }
        }}
        css={bigSwitchStyle}
        ref={ref}
      />
    </ActionRow>
  );
}
