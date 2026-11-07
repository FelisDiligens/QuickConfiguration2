import { commandErrorToString } from "@/commands/errors";
import Mods from "@/commands/mods";
import { PageLoadingAlert } from "@/components/common/LoadingAlert";
import PageContainer from "@/components/common/PageContainer";
import PagePathError from "@/components/common/PagePathError";
import PageTitle from "@/components/common/PageTitle";
import { useAsync } from "@/hooks/async";
import useGamePathCheck from "@/hooks/useGamePathCheck";
import usePathCheck from "@/hooks/usePathCheck";
import { useProfilesStore } from "@/stores/profiles";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import MigrationView from "./MigrationView";

interface Props {
  title: string;
  children?: React.ReactNode;
}

export default function MigrationBoundary(props: Props) {
  const { t } = useTranslation();
  const gamePath = useProfilesStore((store) => store.getGamePath());
  const modsPath = useProfilesStore((store) => store.getModsPath());
  const gamePathState = useGamePathCheck(gamePath);
  const modsPathState = usePathCheck(modsPath);
  const {
    data: migrationState,
    isPending,
    reload,
  } = useAsync({
    promiseFn: async () => {
      if (!modsPath) throw new Error("Mods path not set");
      return await Mods.legacy.detectMigrationState(modsPath);
    },
    watch: [modsPath],
    enabled: gamePathState === "ok" && modsPathState === "ok",
    onRejected: (error) => {
      console.error(
        "Could not determine mods migration state:",
        commandErrorToString(error),
      );
    },
  });
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
  } else if (
    isPending ||
    gamePathState === "checking" ||
    modsPathState === "checking"
  ) {
    return (
      <PageContainer>
        <PageTitle>{props.title}</PageTitle>
        <PageLoadingAlert>{t("common.loading")}</PageLoadingAlert>
      </PageContainer>
    );
  } else if (
    migrationState &&
    migrationState !== "none" &&
    migrationState !== "v1.9-migrated"
  ) {
    return (
      <MigrationView
        migrationState={migrationState}
        reloadMigrationBoundary={reload}
      />
    );
  } else {
    return <>{props.children}</>;
  }
}
