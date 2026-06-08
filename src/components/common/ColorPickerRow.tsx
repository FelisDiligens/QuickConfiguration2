import { css } from "@emotion/react";
import { faBrush } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef, useState } from "react";
import { Button, InputGroup, OverlayTrigger, Popover } from "react-bootstrap";
import { HexColorInput, HexColorPicker } from "react-colorful";
import { useTranslation } from "react-i18next";
import ActionRow from "./ActionRow";
import { FlexRow } from "./Flex";

interface Props {
  title: string;
  subtitle?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  afterTitleSlot?: React.ReactNode;
}

function ColorOrb(props: { color: string }) {
  return (
    <div
      css={css`
        display: inline-block;
        width: 32px;
        height: 32px;
        flex-shrink: 0;
        background-color: ${props.color};
        border-radius: 100%;
        border: 1px solid gray;
      `}
    ></div>
  );
}

function ColorPicker(props: {
  value?: string;
  onChange?: (value: string) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const pickButtonRef = useRef<HTMLButtonElement>(null);

  function handleClick(ev: React.MouseEvent | MouseEvent) {
    if (show && popoverRef.current && pickButtonRef.current) {
      if (
        !popoverRef.current.contains(ev.target as Node | null) &&
        !pickButtonRef.current.contains(ev.target as Node | null)
      ) {
        setShow(false);
      }
    }
  }

  function handleKeyDown(ev: React.KeyboardEvent | KeyboardEvent) {
    if (ev.key === "Escape") {
      setShow(false);
    }
  }

  function registerEvents() {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClick);
  }

  function removeEvents() {
    document.removeEventListener("keydown", handleKeyDown);
    document.removeEventListener("mousedown", handleClick);
  }

  useEffect(() => {
    if (show) registerEvents();
    else removeEvents();
    return removeEvents;
  }, [show]);

  return (
    <>
      <OverlayTrigger
        trigger={["click"]}
        placement="left"
        container={props.containerRef}
        show={show}
        onToggle={setShow}
        overlay={
          <Popover onKeyDown={handleKeyDown}>
            <Popover.Body ref={popoverRef}>
              <HexColorPicker color={props.value} onChange={props.onChange} />
              <InputGroup
                css={css`
                  width: 200px;
                  margin-top: 20px;
                `}
              >
                <InputGroup.Text>#</InputGroup.Text>
                <HexColorInput
                  color={props.value}
                  onChange={props.onChange}
                  className="form-control"
                />
              </InputGroup>
            </Popover.Body>
          </Popover>
        }
      >
        <Button
          onKeyDown={handleKeyDown}
          variant="outline-primary"
          ref={pickButtonRef}
          css={css`
            width: auto;
          `}
        >
          <FlexRow center gap="10px">
            <FontAwesomeIcon size="lg" icon={faBrush} />
            <span>{t("common.pickColorButton")}</span>
          </FlexRow>
        </Button>
      </OverlayTrigger>
    </>
  );
}

export default function ColorPickerRow(props: Props) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const defaultValue = props.defaultValue || "#000000";
  return (
    <ActionRow
      title={props.title}
      subtitle={props.subtitle}
      afterTitleSlot={props.afterTitleSlot}
      ref={containerRef}
      prefix={<ColorOrb color={props.value || defaultValue} />}
      suffix={
        <>
          <ColorPicker
            value={props.value}
            onChange={props.onChange}
            containerRef={containerRef}
          />
          <Button
            variant="outline-danger"
            onClick={() => props.onChange && props.onChange(defaultValue)}
          >
            {t("common.resetButton")}
          </Button>
        </>
      }
    />
  );
}
