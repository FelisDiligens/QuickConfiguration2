import { BethNet24Icon, Steam24Icon, Xbox24Icon } from "@/assets/img";
import { useProfilesStore } from "@/stores/profiles";
import { css } from "@emotion/react";
import {
  faQuestionCircle,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "react-i18next";
import NavButton from "./NavButton";

interface Props {
  collapsed: boolean;
}

export default function NavProfileButton(props: Props) {
  const { t } = useTranslation();
  const profile = useProfilesStore((store) => store.getSelectedProfile());
  return (
    <>
      <span
        css={css`
          padding: 0 10px;
          white-space: nowrap;
          opacity: ${props.collapsed ? "0" : "1"};
          transition: opacity 100ms ease;
        `}
      >
        {t("navigation.selectedProfile")}
      </span>
      {profile ? (
        <NavButton to="/profiles">
          {profile.gameEdition == "Unknown" && (
            <FontAwesomeIcon size="xl" icon={faQuestionCircle} />
          )}
          {(profile.gameEdition == "Steam" ||
            profile.gameEdition == "SteamPTS") && <img src={Steam24Icon} />}
          {(profile.gameEdition == "Xbox" ||
            profile.gameEdition == "MSStore") && <img src={Xbox24Icon} />}
          {(profile.gameEdition == "BethesdaNet" ||
            profile.gameEdition == "BethesdaNetPTS") && (
            <img src={BethNet24Icon} />
          )}
          <span>{profile.title}</span>
        </NavButton>
      ) : (
        <NavButton to="/profiles">
          <FontAwesomeIcon size="xl" icon={faTriangleExclamation} />
          <span>{t("navigation.noProfile")}</span>
        </NavButton>
      )}
    </>
  );
}
