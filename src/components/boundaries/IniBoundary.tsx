import useIni from "@/hooks/tweaks/useIni";
import { useTranslation } from "react-i18next";
import { PageLoadingAlert } from "../common/LoadingAlert";
import PageContainer from "../common/PageContainer";
import PageIniErrorDetails from "../common/PageIniErrorDetails";
import PageTitle from "../common/PageTitle";

interface Props {
  title: string;
  children?: React.ReactNode;
}

export function IniBoundary(props: Props) {
  const { t } = useTranslation();
  const [isLoading, error, errorContext, reload] = useIni();
  if (error) {
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
