import { useSettingsStore } from "@/stores/settings";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { MouseEventHandler } from "react";
import { Button } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import styles from "./NavHamburger.styles";

interface Props {
  onClick: MouseEventHandler;
}

export default function NavHamburger(props: Props) {
  const { t } = useTranslation();
  const collapsed = useSettingsStore((store) => store.navigationCollapsed);
  return (
    <Button
      title={
        collapsed
          ? t("navigation.expandNavigation")
          : t("navigation.collapseNavigation")
      }
      css={styles.navHamburger(collapsed)}
      onClick={props.onClick}
      aria-pressed={collapsed}
    >
      <FontAwesomeIcon icon={faBars} />
    </Button>
  );
}
