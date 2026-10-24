import usePathCheck from "@/hooks/usePathCheck";
import { modsStoreSync } from "@/stores/mods";
import { useProfilesStore } from "@/stores/profiles";
import { useSyncLoadState } from "@/utils/zustand";
import { useEffect } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PageErrorAlert } from "../common/ErrorAlert";
import { PageLoadingAlert } from "../common/LoadingAlert";
import PageContainer from "../common/PageContainer";
import PagePathError from "../common/PagePathError";
import PageTitle from "../common/PageTitle";

interface Props {
  title: string;
  children?: React.ReactNode;
}

export function ModsBoundary(props: Props) {
  const { t } = useTranslation();
  const modsPath = useProfilesStore((store) => store.getModsPath());
  const pathState = usePathCheck(modsPath);
  const { isPending, hasLoaded, error } = useSyncLoadState(modsStoreSync);

  useEffect(() => {
    if (!hasLoaded && modsPath && pathState === "ok")
      modsStoreSync.load().catch(console.error);
  }, [pathState]);

  if (
    pathState === "not-set" ||
    pathState === "invalid" ||
    pathState === "missing"
  ) {
    return (
      <PagePathError
        title={props.title}
        state={pathState}
        path={modsPath}
        i18nKeyPrefix="errors.path.mods"
      >
        <p>{t("errors.path.mods.description")}</p>
        <Trans
          t={t}
          i18nKey="errors.path.mods.instructions"
          components={{
            ul: <ul />,
            li: <li />,
            b: <b />,
            a: <Link to="/profiles" />,
          }}
          tOptions={{ joinArrays: "" }}
        />
      </PagePathError>
    );
  } else if (pathState === "checking") {
    return (
      <PageContainer>
        <PageTitle>{props.title}</PageTitle>
        <PageLoadingAlert>{t("common.loading")}</PageLoadingAlert>
      </PageContainer>
    );
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
