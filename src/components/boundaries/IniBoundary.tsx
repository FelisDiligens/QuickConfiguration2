import usePathCheck from "@/hooks/usePathCheck";
import useIni from "@/hooks/tweaks/useIni";
import { useProfilesStore } from "@/stores/profiles";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PageLoadingAlert } from "../common/LoadingAlert";
import PageContainer from "../common/PageContainer";
import PageIniErrorDetails from "../common/PageIniErrorDetails";
import PagePathError from "../common/PagePathError";
import PageTitle from "../common/PageTitle";

interface Props {
  title: string;
  children?: React.ReactNode;
}

export function IniBoundary(props: Props) {
  const { t } = useTranslation();
  const iniPath = useProfilesStore((store) => store.getIniPath());
  const pathState = usePathCheck(iniPath);
  const [isLoading, error, errorContext, reload] = useIni();

  if (
    pathState === "not-set" ||
    pathState === "invalid" ||
    pathState === "missing"
  ) {
    return (
      <PagePathError
        title={props.title}
        state={pathState}
        path={iniPath}
        i18nKeyPrefix="errors.path.ini"
      >
        <p>{t("errors.path.ini.description")}</p>
        <Trans
          t={t}
          i18nKey="errors.path.ini.instructions"
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
      <PageIniErrorDetails
        pageTitle={props.title}
        error={error}
        context={errorContext}
        reloadIni={reload}
      />
    );
  } else if (isLoading) {
    return (
      <PageContainer>
        <PageTitle>{props.title}</PageTitle>
        <PageLoadingAlert>{t("common.loading-ini")}</PageLoadingAlert>
      </PageContainer>
    );
  }
  return <>{props.children}</>;
}
