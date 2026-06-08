import { modsStoreSync } from "@/stores/mods";
import { useProfilesStore } from "@/stores/profiles";
import { useSyncLoadState } from "@/utils/zustand";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import ButtonRow from "../common/ButtonRow";
import { PageErrorAlert } from "../common/ErrorAlert";
import { PageLoadingAlert } from "../common/LoadingAlert";
import PageAlert from "../common/PageAlert";
import PageContainer from "../common/PageContainer";
import PageTitle from "../common/PageTitle";
import PreferencesGroup from "../common/PreferencesGroup";

function NoModsPathError(props: { title: string }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <PageContainer>
      <PageTitle>{props.title}</PageTitle>
      <PageAlert>{t("mods.errors.noModsPath")}</PageAlert>
      <PreferencesGroup subtitle={t("mods.errors.goToProfilesToSetModsPath")}>
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

interface Props {
  title: string;
  children?: React.ReactNode;
}

export function ModsBoundary(props: Props) {
  const { t } = useTranslation();
  const modsPath = useProfilesStore((store) => store.getModsPath());
  const { isPending, hasLoaded, error } = useSyncLoadState(modsStoreSync);

  useEffect(() => {
    if (!hasLoaded && modsPath) modsStoreSync.load().catch(console.error);
  }, []);

  if (!modsPath) {
    return <NoModsPathError title={props.title} />;
  } else if (error) {
    return (
      <PageContainer>
        <PageTitle>{props.title}</PageTitle>
        <PageErrorAlert reason={error} />
      </PageContainer>
    );
  } else if (isPending || !hasLoaded) {
    return (
      <PageContainer>
        <PageTitle>{props.title}</PageTitle>
        <PageLoadingAlert>{t("common.loading")}</PageLoadingAlert>
      </PageContainer>
    );
  }
  return <>{props.children}</>;
}
