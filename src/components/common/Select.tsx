import { css, SerializedStyles } from "@emotion/react";
import { useId } from "react";
import { Form } from "react-bootstrap";

interface Props {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  isInvalid?: boolean;
  disabled?: boolean;

  children?: React.ReactNode;
  className?: string;
  css?: SerializedStyles;
}

export default function Select(props: Props) {
  const id = useId();
  const control = (
    <Form.Select
      value={props.value}
      onChange={(ev) => {
        if (props.onChange) props.onChange(ev.currentTarget.value);
      }}
      isInvalid={props.isInvalid}
      disabled={props.disabled}
      className={props.className}
    >
      {props.children}
    </Form.Select>
  );
  return props.label ? (
    <Form.Group
      controlId={id}
      className="form-floating"
      css={css`width: 100%;`}
    >
      {control}
      <Form.Label>{props.label}</Form.Label>
    </Form.Group>
  ) : (
    control
  );
}
