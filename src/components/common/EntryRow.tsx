import { css } from "@emotion/react";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMemo, useState } from "react";
import { Button } from "react-bootstrap";
import ActionRow from "./ActionRow";
import Entry from "./Entry";
import { FlexCol } from "./Flex";

interface Props {
  title?: string;
  subtitle?: string;
  floatingLabel?: string;
  placeholder?: string;
  arrangement?: "lr" | "td";
  type?: "text" | "password";
  value?: string;
  defaultValue?: string;
  isInvalid?: boolean;
  onChange?: (value: string) => void;
  afterTitleSlot?: React.ReactNode;
  suffix?: React.ReactNode;
  disabled?: boolean;
}

export default function EntryRow(props: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const controlType = useMemo(() => {
    if (props.type === "password") return showPassword ? "text" : "password";
    return props.type || "text";
  }, [props.type, showPassword]);

  return (
    <ActionRow
      title={props.title}
      subtitle={props.subtitle}
      arrangement={props.arrangement || "td"}
      afterTitleSlot={props.afterTitleSlot}
      suffix={
        <>
          <FlexCol grow={3} fullWidth>
            <Entry
              label={props.floatingLabel}
              type={controlType}
              value={props.value}
              defaultValue={props.defaultValue}
              onChange={props.onChange}
              isInvalid={props.isInvalid}
              disabled={props.disabled}
              placeholder={props.placeholder || " "}
              css={css`min-width: 100px;`}
            />
          </FlexCol>
          {props.type === "password" && (
            <FlexCol>
              <Button
                variant="outline-secondary"
                onClick={() => setShowPassword(!showPassword)}
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </Button>
            </FlexCol>
          )}
          {props.suffix}
        </>
      }
    />
  );
}
