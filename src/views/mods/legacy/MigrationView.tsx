import { ModsMigrationState } from "@/commands/bindings";
import { AnyError } from "@/commands/errors";
import {
  ButtonRow,
  PageAlert,
  PageContainer,
  PageErrorAlert,
  PageTitle,
  PreferencesGroup,
} from "@/components/common";
import { AppTheme } from "@/components/MyThemeProvider";
import { confirmModal } from "@/hooks/useModal";
import { css } from "@emotion/react";
import {
  faRightLeft,
  faSackXmark,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useModMigration } from "./useModMigration";

interface Props {
  migrationState: ModsMigrationState;
  reloadMigrationBoundary: () => void;
}

export default function MigrationView(props: Props) {
  const { t } = useTranslation();
  const [error, setError] = useState<AnyError>(null);
  const { migrateMods, deleteMods } = useModMigration({
    onSuccess: props.reloadMigrationBoundary,
    onError: setError,
  });

  async function confirmMigrateMods() {
    const confirmed = await confirmModal({
      title: t("mods.migration.migrateModal.title"),
      children: (
        <>
          <p>{t("mods.migration.migrateModal.description")}</p>
          <ul>
            <li>{t("mods.migration.migrateModal.bundledArchives")}</li>
            <li>{t("mods.migration.migrateModal.separateArchives")}</li>
            <li>{t("mods.migration.migrateModal.looseFiles")}</li>
          </ul>
          <p>{t("mods.migration.migrateModal.archive2Note")}</p>
          <p css={css`color: var(--bs-danger);`}>
            {t("mods.migration.migrateModal.cannotBeUndone")}
          </p>
        </>
      ),
    });
    if (confirmed) migrateMods().catch(console.error);
  }

  async function confirmDeleteMods() {
    const confirmed = await confirmModal({
      title: t("mods.migration.deleteModal.title"),
      children: (
        <>
          <p>{t("mods.migration.deleteModal.description")}</p>
          <ul>
            <li>{t("mods.migration.deleteModal.bundledArchivesDetail")}</li>
            <li>{t("mods.migration.deleteModal.deployedFiles")}</li>
            <li>{t("mods.migration.deleteModal.folders")}</li>
          </ul>
          <p css={css`color: var(--bs-danger);`}>
            {t("mods.migration.deleteModal.cannotBeUndone")}
          </p>
        </>
      ),
    });
    if (confirmed) deleteMods().catch(console.error);
  }

  return (
    <PageContainer>
      <PageTitle>{t("mods.migration.title")}</PageTitle>
      <div
        css={(theme: AppTheme) => css`
        margin: 10px auto 30px auto;
        width: 100%;
        max-width: ${theme.card.maxWidth};
      `}
      >
        {error && <PageErrorAlert reason={error}></PageErrorAlert>}
        <p>{t("mods.migration.description")}</p>
        <p>
          {t("mods.migration.migrationState")}{" "}
          <code>{props.migrationState}</code>
        </p>
        <PageAlert>
          <FontAwesomeIcon size="xl" icon={faTriangleExclamation} />
          &nbsp;
          <span>{t("mods.migration.warning")}</span>
        </PageAlert>
        <PreferencesGroup title={t("mods.migration.decideWhatToDo")}>
          <ButtonRow
            center
            variant="danger"
            onClick={() => void confirmMigrateMods()}
          >
            <FontAwesomeIcon icon={faRightLeft} />
            &nbsp; {t("mods.migration.migrateOldModsButton")}
          </ButtonRow>
          <ButtonRow
            center
            variant="danger"
            onClick={() => void confirmDeleteMods()}
          >
            <FontAwesomeIcon icon={faSackXmark} />
            &nbsp; {t("mods.migration.deleteOldModsButton")}
          </ButtonRow>
        </PreferencesGroup>
      </div>
    </PageContainer>
  );
}
