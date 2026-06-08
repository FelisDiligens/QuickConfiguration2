import { ModsMigrationState } from "@/commands/bindings";
import ButtonRow from "@/components/common/ButtonRow";
import { PageErrorAlert } from "@/components/common/ErrorAlert";
import PageAlert from "@/components/common/PageAlert";
import PageContainer from "@/components/common/PageContainer";
import PageTitle from "@/components/common/PageTitle";
import PreferencesGroup from "@/components/common/PreferencesGroup";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import LoadingModal from "@/components/modals/LoadingModal";
import { AppTheme } from "@/components/MyThemeProvider";
import { useModMigration } from "@/hooks/mods";
import { css } from "@emotion/react";
import {
  faRightLeft,
  faSackXmark,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  migrationState: ModsMigrationState;
  reloadMigrationBoundary: () => void;
}

export default function MigrationView(props: Props) {
  const { t } = useTranslation();
  const { isPending, error, statusText, progress, migrateMods, deleteMods } =
    useModMigration(props.reloadMigrationBoundary);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  return (
    <>
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
              onClick={() => {
                setShowMigrationModal(true);
              }}
            >
              <FontAwesomeIcon icon={faRightLeft} />
              &nbsp; {t("mods.migration.migrateOldModsButton")}
            </ButtonRow>
            <ButtonRow
              center
              variant="danger"
              onClick={() => {
                setShowDeletionModal(true);
              }}
            >
              <FontAwesomeIcon icon={faSackXmark} />
              &nbsp; {t("mods.migration.deleteOldModsButton")}
            </ButtonRow>
          </PreferencesGroup>
        </div>
      </PageContainer>
      <LoadingModal show={isPending} label={statusText} progress={progress} />
      <ConfirmModal
        title={t("mods.migration.migrateModal.title")}
        show={showMigrationModal}
        onConfirm={() => {
          setShowMigrationModal(false);
          migrateMods().catch(console.error);
        }}
        onAbort={() => {
          setShowMigrationModal(false);
        }}
      >
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
      </ConfirmModal>
      <ConfirmModal
        title={t("mods.migration.deleteModal.title")}
        show={showDeletionModal}
        onConfirm={() => {
          setShowDeletionModal(false);
          deleteMods().catch(console.error);
        }}
        onAbort={() => {
          setShowDeletionModal(false);
        }}
      >
        <p>{t("mods.migration.deleteModal.description")}</p>
        <ul>
          <li>{t("mods.migration.deleteModal.bundledArchivesDetail")}</li>
          <li>{t("mods.migration.deleteModal.deployedFiles")}</li>
          <li>{t("mods.migration.deleteModal.folders")}</li>
        </ul>
        <p css={css`color: var(--bs-danger);`}>
          {t("mods.migration.deleteModal.cannotBeUndone")}
        </p>
      </ConfirmModal>
    </>
  );
}
