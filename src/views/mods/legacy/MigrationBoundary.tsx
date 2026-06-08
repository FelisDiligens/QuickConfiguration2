import { commandErrorToString } from "@/commands/errors";
import Mods from "@/commands/mods";
import { PageLoadingAlert } from "@/components/common/LoadingAlert";
import PageContainer from "@/components/common/PageContainer";
import PageTitle from "@/components/common/PageTitle";
import { useAsync } from "@/hooks/async";
import { useProfilesStore } from "@/stores/profiles";
import { useTranslation } from "react-i18next";
import MigrationView from "./MigrationView";

interface Props {
  title: string;
  children?: React.ReactNode;
}

export default function MigrationBoundary(props: Props) {
  const { t } = useTranslation();
  const modsPath = useProfilesStore((store) => store.getModsPath());
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
    onRejected: (error) => {
      console.error(
        "Could not determine mods migration state:",
        commandErrorToString(error),
      );
    },
  });
  if (isPending) {
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
