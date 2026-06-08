import { resourceListStoreSync } from "@/stores/resourceList";
import { useSyncLoadState } from "@/utils/zustand";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { PageErrorAlert } from "../common/ErrorAlert";
import { PageLoadingAlert } from "../common/LoadingAlert";
import PageAlert from "../common/PageAlert";
import PageContainer from "../common/PageContainer";
import PageTitle from "../common/PageTitle";

interface Props {
  title: string;
  children?: React.ReactNode;
}

export function ResourceListBoundary(props: Props) {
  const { t } = useTranslation();
  const { hasLoaded, isPending, error } = useSyncLoadState(
    resourceListStoreSync,
  );
  useEffect(() => {
    if (!hasLoaded) resourceListStoreSync.load().catch(console.error);
  }, []);
  if (error) {
    return (
      <PageContainer>
        <PageTitle>{props.title}</PageTitle>
        <PageAlert>{t("mods.resourceList.loadFailed")}</PageAlert>
        <PageErrorAlert reason={error} />
      </PageContainer>
    );
  } else if (!hasLoaded || isPending) {
    return (
      <PageContainer>
        <PageTitle>{props.title}</PageTitle>
        <PageLoadingAlert>{t("common.loading")}</PageLoadingAlert>
      </PageContainer>
    );
  } else {
    return <>{props.children}</>;
  }
}
