import { BethNet24Icon, Steam24Icon, Xbox24Icon } from "@/assets/img";
import { GameEdition } from "@/commands/bindings";
import { AppTheme } from "@/components/MyThemeProvider";
import { css } from "@emotion/react";
import {
  faArrowDown,
  faArrowUp,
  faGripVertical,
  faQuestionCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, ListGroup } from "react-bootstrap";

const iconStyle = css`
  min-width: 24px;
  padding: 0 8px;
`;

const textColor = (active: boolean) => (theme: AppTheme) => css`
  color: ${active ? "black" : theme.fontColor} !important;
`;

interface Props {
  profileName: string;
  gameEdition: GameEdition;
  active: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export default function ProfileListRow(props: Props) {
  const handleKeyDown = (ev: React.KeyboardEvent) => {
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      props.onSelect();
    }
  };
  return (
    <ListGroup.Item
      as="div"
      action
      active={props.active}
      css={(theme: AppTheme) => css`
        display: flex;
        align-items: center;
        padding: 0;
        ${textColor(props.active)(theme)}
      `}
      className="allow-drag"
      draggable={true}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={props.onSelect}
        onKeyDown={handleKeyDown}
        css={css`
          display: flex;
          flex-grow: 1;
          align-items: center;
          padding: 10px;
          &:hover {
            cursor: default;
          }
        `}
      >
        <FontAwesomeIcon
          icon={faGripVertical}
          css={css`
            &:hover {
              cursor: grab;
            }
          `}
        />
        {props.gameEdition == "Unknown" && (
          <FontAwesomeIcon size="xl" css={iconStyle} icon={faQuestionCircle} />
        )}
        {(props.gameEdition == "Steam" || props.gameEdition == "SteamPTS") && (
          <img src={Steam24Icon} css={iconStyle} />
        )}
        {(props.gameEdition == "Xbox" || props.gameEdition == "MSStore") && (
          <img src={Xbox24Icon} css={iconStyle} />
        )}
        {(props.gameEdition == "BethesdaNet" ||
          props.gameEdition == "BethesdaNetPTS") && (
          <img src={BethNet24Icon} css={iconStyle} />
        )}
        &nbsp;
        {props.profileName}
      </div>
      <Button
        variant="link"
        css={(theme: AppTheme) => css`
          ${textColor(props.active)(theme)}
          transition: transform 100ms ease;
          &:hover {
            transform: scale(1.25);
          }
        `}
        onClick={props.onMoveUp}
      >
        <FontAwesomeIcon icon={faArrowUp} />
      </Button>
      <Button
        variant="link"
        css={(theme: AppTheme) => css`
          ${textColor(props.active)(theme)}
          transition: transform 100ms ease;
          &:hover {
            transform: scale(1.25);
          }
        `}
        onClick={props.onMoveDown}
      >
        <FontAwesomeIcon icon={faArrowDown} />
      </Button>
    </ListGroup.Item>
  );
}
