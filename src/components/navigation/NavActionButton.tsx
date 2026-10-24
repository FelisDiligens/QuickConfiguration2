import { useSettingsStore } from "@/stores/settings";
import { MouseEventHandler } from "react";
import { Button, Dropdown } from "react-bootstrap";
import styles from "./NavActionButton.styles";

export function NavActionButton(props: {
  title: string;
  children: React.ReactNode;
  onClick?: MouseEventHandler;
}) {
  const collapsed = useSettingsStore((store) => store.navigationCollapsed);
  return (
    <Button
      title={props.title}
      css={styles.navActionButton(collapsed)}
      onClick={props.onClick}
    >
      {props.children}
    </Button>
  );
}

export function NavActionDropdownToggle(props: {
  title: string;
  children: React.ReactNode;
}) {
  const collapsed = useSettingsStore((store) => store.navigationCollapsed);
  return (
    <Dropdown.Toggle
      title={props.title}
      css={styles.navActionDropDown(collapsed)}
    >
      {props.children}
    </Dropdown.Toggle>
  );
}
