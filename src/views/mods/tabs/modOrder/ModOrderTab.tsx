import { AnyError } from "@/commands/errors";
import { FlexRow } from "@/components/common";
import { useModDeployment, useModManagement } from "@/hooks/mods";
import { modsEventBus } from "@/services/mods";
import { useModsStore } from "@/stores/mods";
import { css } from "@emotion/react";
import { faCaretLeft, faCaretRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { atom, useAtom } from "jotai";
import { useEffect } from "react";
import { Button } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { useArchive2Modals } from "./modals/archive2/useArchive2Modals";
import { useCommonModals } from "./modals/common/useCommonModals";
import { useModConflictingFilesModal } from "./modals/modActions/useModConflictingFilesModal";
import { useModDownloadModals } from "./modals/modDownload/useModDownloadModals";
import { useModInstallationModals } from "./modals/modInstallation/useModInstallationModals";
import { useNexusModsModals } from "./modals/nexusMods/useNexusModsModals";
import ModDetails from "./ModDetails";
import ModTable from "./ModTable";
import StatusRow from "./StatusRow";
import ToolRow from "./ToolRow";

/** Controls whether the details side panel is shown */
const showDetailsAtom = atom(true);

export default function ModOrderTab() {
  const { t } = useTranslation();

  const mods = useModsStore((store) => store.mods);
  const selectedModIndex = useModsStore((store) => store.getSelectedModIndex());
  const [showDetails, setShowDetails] = useAtom(showDetailsAtom);

  const { deployMods } = useModDeployment();
  useModManagement();
  useModConflictingFilesModal();
  useNexusModsModals();
  useArchive2Modals();
  useModDownloadModals();
  useModInstallationModals();
  useCommonModals();

  // React to messages:
  useEffect(
    () =>
      modsEventBus.onUIActionEvent((message) => {
        switch (message.type) {
          case "mods-deploy":
            deployMods().catch((reason) => {
              console.error(reason);
              modsEventBus.emitProgressAborted(reason as AnyError);
            });
            break;
          // no default
        }
      }),
    [],
  );

  return (
    <>
      <ToolRow />
      <FlexRow grow css={css`min-height: 0;`}>
        <ModTable />
        {mods[selectedModIndex] && (
          <Button
            onClick={() => setShowDetails((value) => !value)}
            title={
              showDetails
                ? t("mods.modOrderTab.detailsPane.collapseSidePanel")
                : t("mods.modOrderTab.detailsPane.expandSidePanel")
            }
            aria-pressed={showDetails}
            variant="secondary"
            css={css`
              border-radius: 0;
              width: 24px;
              padding: 0;
            `}
          >
            {showDetails ? (
              <FontAwesomeIcon icon={faCaretRight} />
            ) : (
              <FontAwesomeIcon icon={faCaretLeft} />
            )}
          </Button>
        )}
        {showDetails && mods[selectedModIndex] && <ModDetails />}
      </FlexRow>
      <StatusRow />
    </>
  );
}
