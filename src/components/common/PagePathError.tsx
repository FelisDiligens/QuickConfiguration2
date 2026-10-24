import { type PathCheckState } from "@/hooks/usePathCheck";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
  state: Exclude<PathCheckState, "checking" | "ok">;
  path: string | undefined;
  i18nKeyPrefix: string;
  children?: React.ReactNode;
}

export default function PagePathError(props: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const stateKey = {
    "not-set": "notSet",
    invalid: "invalid",
    missing: "missing",
  }[props.state];

  return (
    <PageContainer>
      <PageTitle>{props.title}</PageTitle>
      <PageAlert>
        {t(`${props.i18nKeyPrefix}.${stateKey}`, { path: props.path })}
      </PageAlert>
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
