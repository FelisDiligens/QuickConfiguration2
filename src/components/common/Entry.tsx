import { css, SerializedStyles } from "@emotion/react";
import { useId } from "react";
import { Form } from "react-bootstrap";

interface Props {
  label?: string;
  type?: "text" | "email" | "password";
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  isInvalid?: boolean;
  disabled?: boolean;
  placeholder?: string;

  className?: string;
  css?: SerializedStyles;
}

export default function Entry(props: Props) {
  const id = useId();
  // For some reason a placeholder is required for the floating label to work...
  const control = (
    <Form.Control
      type={props.type}
      value={props.value}
      defaultValue={props.defaultValue}
      onChange={(ev) => {
        if (props.onChange) props.onChange(ev.currentTarget.value);
      }}
      isInvalid={props.isInvalid}
      disabled={props.disabled}
      placeholder={props.placeholder || " "}
      className={props.className}
    />
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
