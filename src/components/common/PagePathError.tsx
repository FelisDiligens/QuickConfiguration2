import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import ButtonRow from "./ButtonRow";
import PageAlert from "./PageAlert";
import PageContainer from "./PageContainer";
import PageContent from "./PageContent";
import PageTitle from "./PageTitle";
import PreferencesGroup from "./PreferencesGroup";

interface Props {
  title: string;
  state: "not-set" | "invalid" | "missing" | "not-game";
  path?: string;
  i18nKeyPrefix: string;
  children?: React.ReactNode;
}

export default function PagePathError(props: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const i18nKey = useMemo(
    () =>
      ({
        "not-set": `${props.i18nKeyPrefix}.notSet`,
        invalid: `${props.i18nKeyPrefix}.invalid`,
        missing: `${props.i18nKeyPrefix}.missing`,
        "not-game": `${props.i18nKeyPrefix}.notGame`,
      })[props.state],
    [props.state, props.i18nKeyPrefix],
  );

  return (
    <PageContainer>
      <PageTitle>{props.title}</PageTitle>
      <PageAlert>{t(i18nKey, { path: props.path })}</PageAlert>
      <PageContent>{props.children}</PageContent>
      <PreferencesGroup subtitle={t("errors.path.goToProfiles")}>
        <ButtonRow
          onClick={() => navigate("/profiles")}
          iconRight={<FontAwesomeIcon icon={faChevronRight} />}
        >
          {t("settings.profiles.goToProfiles")}
        </ButtonRow>
      </PreferencesGroup>
    </PageContainer>
  );
}
