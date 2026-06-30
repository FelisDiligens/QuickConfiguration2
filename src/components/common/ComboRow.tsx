import { css } from "@emotion/react";
import * as React from "react";
import { useRef } from "react";
import { Form } from "react-bootstrap";
import ActionRow from "./ActionRow";

interface Props {
  title?: string;
  subtitle?: string;
  arrangement?: "lr" | "td";
  children: React.ReactNode;
  afterTitleSlot?: React.ReactNode;
  suffix?: React.ReactNode;
  value?: string;
  onChange?: (value: string) => void;
}

/**
 * Only works in GtkWebkit!
 */
function sendClickEventTo(select: HTMLSelectElement) {
  // https://stackoverflow.com/questions/18344970/how-to-activate-the-dropdown-menu-of-the-select-element-via-keyboard
  const event = new MouseEvent("mousedown", {
    view: window,
    bubbles: true,
    cancelable: true,
  });
  select.dispatchEvent(event);
}

interface HTMLSelectElementEx extends HTMLSelectElement {
  // https://developer.mozilla.org/en-US/docs/Web/API/HTMLSelectElement/showPicker
  /**
   * The `HTMLSelectElement.showPicker()` method displays the browser picker for a `select` element.
   * This is the same picker that would normally be displayed when the element is selected, but can be triggered from a button press or other user interaction.
   * @throws {DOMException} `InvalidStateError` - Thrown if the element is not mutable, meaning that the user cannot modify it and/or that it cannot be automatically prefilled.
   * @throws {DOMException} `NotAllowedError` - Thrown if not explicitly triggered by a user action such as a touch gesture or mouse click (the picker requires Transient activation).
   * @throws {DOMException} `NotSupportedError` - Thrown if the element associated with the picker is not being rendered.
   * @throws {DOMException} `SecurityError` - Thrown if called in a cross-origin iframe.
   */
  showPicker(): void;
}

export default function ComboRow(props: Props) {
  const ref = useRef<HTMLSelectElement | null>(null);
  function onActivate(ev: React.MouseEvent) {
    let el = ev.target as HTMLElement;
    if (
      ref.current &&
      !(ev.target instanceof HTMLSelectElement) &&
      !["button", "svg", "path"].includes(el?.tagName?.toLowerCase()) &&
      !el?.className.includes("ignore-click")
    ) {
      console.log(el?.tagName?.toLowerCase(), ev.target);
      if ("showPicker" in ref.current) {
        // For Chromium:
        (ref.current as HTMLSelectElementEx).showPicker();
      } else {
        // For Webkit:
        sendClickEventTo(ref.current);
      }
    }
  }
  return (
    <ActionRow
      title={props.title}
      subtitle={props.subtitle}
      arrangement={props.arrangement}
      onActivate={onActivate}
      afterTitleSlot={props.afterTitleSlot}
      suffix={props.suffix}
    >
      <Form.Select
        ref={ref}
        value={props.value}
        onChange={(el) => props.onChange && props.onChange(el.target.value)}
        css={css`
          min-width: 150px;
        `}
      >
        {props.children}
      </Form.Select>
    </ActionRow>
  );
}
