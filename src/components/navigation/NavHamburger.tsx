import { useSettingsStore } from "@/stores/settings";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { MouseEventHandler } from "react";
import { Button } from "react-bootstrap";
import styles from "./NavHamburger.styles";

interface Props {
  onClick: MouseEventHandler;
}

export default function NavHamburger(props: Props) {
  const collapsed = useSettingsStore((store) => store.navigationCollapsed);
  return (
    <Button css={styles.navHamburger(collapsed)} onClick={props.onClick}>
      <FontAwesomeIcon icon={faBars} />
    </Button>
  );
}
