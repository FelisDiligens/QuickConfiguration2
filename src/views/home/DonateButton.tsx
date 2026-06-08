import { KoFiButtonImage } from "@/assets/img";
import { urls } from "@/info";
import { css } from "@emotion/react";
import { faHeart } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { open } from "@tauri-apps/plugin-shell";
import { useState } from "react";
import styles from "./DonateButton.styles";

export default function DonateButton() {
  const [donateButtonHovered, setDonateButtonHovered] = useState(false);
  return (
    <div
      css={css`
        position: relative;
        width: 166px;
      `}
    >
      {donateButtonHovered && (
        <div>
          <FontAwesomeIcon icon={faHeart} css={styles.heart.animateUp} />
          <FontAwesomeIcon icon={faHeart} css={styles.heart.animateLeft} />
          <FontAwesomeIcon icon={faHeart} css={styles.heart.animateRight} />
          <FontAwesomeIcon icon={faHeart} css={styles.heart.animateTopLeft} />
          <FontAwesomeIcon icon={faHeart} css={styles.heart.animateTopRight} />
        </div>
      )}
      <img
        css={styles.donateButton}
        src={KoFiButtonImage}
        onClick={() => open(urls.donate)}
        onMouseEnter={() => setDonateButtonHovered(true)}
        onMouseLeave={() => setDonateButtonHovered(false)}
      />
    </div>
  );
}
