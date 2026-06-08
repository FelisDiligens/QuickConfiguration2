import { useSettingsStore } from "@/stores/settings";
import { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./NavButton.styles";

interface Props {
  children: ReactNode;
  to: string;
  aliases?: string[];
}

export default function NavButton(props: Props) {
  const collapsed = useSettingsStore((store) => store.navigationCollapsed);
  const navigate = useNavigate();
  const location = useLocation();
  const active =
    location.pathname == props.to ||
    (props.aliases != undefined && props.aliases.includes(location.pathname));

  function handleClick() {
    navigate(props.to)?.catch((reason) => {
      console.error(`Couldn't navigate to ${props.to}: ${reason}`);
    });
  }

  function handleKeyDown(ev: React.KeyboardEvent) {
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      handleClick();
    }
  }

  return (
    <div
      css={styles.navButton(active, collapsed)}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {props.children}
    </div>
  );
}
