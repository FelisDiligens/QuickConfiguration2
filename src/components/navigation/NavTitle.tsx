import { F76LogoBlack, F76LogoWhite } from "@/assets/img";
import useTheme from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";
import styles from "./NavTitle.styles";

export default function NavTitle() {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <div css={styles.title}>
      <img src={theme == "dark" ? F76LogoWhite : F76LogoBlack} />
      <span>{t("navigation.quickConfiguration")}</span>
    </div>
  );
}
