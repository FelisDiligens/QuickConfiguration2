import useGamePathCheck from "@/hooks/useGamePathCheck";
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
  const gamePath = useProfilesStore((store) => store.getGamePath());
  const modsPath = useProfilesStore((store) => store.getModsPath());
  const gamePathState = useGamePathCheck(gamePath);
  const modsPathState = usePathCheck(modsPath);
  const { isPending, hasLoaded, error } = useSyncLoadState(modsStoreSync);

  useEffect(() => {
    if (!hasLoaded && modsPath && modsPathState === "ok")
      modsStoreSync.load().catch(console.error);
  }, [modsPathState]);

  if (gamePathState !== "ok" && gamePathState !== "checking") {
    return (
      <PagePathError
        title={props.title}
        state={gamePathState}
        path={gamePath}
        i18nKeyPrefix="errors.path.game"
      >
        <p>{t("errors.path.game.description")}</p>
        <Trans
          t={t}
          i18nKey="errors.path.game.instructions"
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
  } else if (modsPathState !== "ok" && modsPathState !== "checking") {
    return (
      <PagePathError
        title={props.title}
        state={modsPathState}
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
  } else if (isPending || !hasLoaded || modsPathState === "checking") {
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
  }
  return <>{props.children}</>;
}
