import { F76LogoWhite, SpinningGearGIF } from "@/assets/img";
import { css } from "@emotion/react";
import { useTranslation } from "react-i18next";

export default function LoadingScreen() {
  const { t } = useTranslation();
  return (
    <div
      css={css`
        position: fixed;
        background-color: black;
        width: 100vw;
        height: 100vh;
        padding: 100px;
        overflow: none;
        text-align: center;
      `}
    >
      <img
        css={css`
          max-width: 300px;
        `}
        src={F76LogoWhite}
      />
      <h1
        css={css`
          color: white;
          font-size: 36pt;
          margin: 0;
          font-family: Overseer;
        `}
      >
        Quick Configuration
      </h1>
      <img
        css={css`
          max-width: 150px;
          margin: 10px;
        `}
        src={SpinningGearGIF}
      />
      <h2
        css={css`
          color: white;
          margin: 0;
        `}
      >
        {t("common.loading")}
      </h2>
    </div>
  );
}
