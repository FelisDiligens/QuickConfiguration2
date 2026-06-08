import { AnyError } from "@/commands/errors";
import { FlexRow } from "@/components/common/Flex";
import { useModDeployment } from "@/hooks/mods";
import { modsEventBus } from "@/services/mods";
import { useModsStore } from "@/stores/mods";
import { css } from "@emotion/react";
import { faCaretLeft, faCaretRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { atom, useAtom } from "jotai";
import { useEffect } from "react";
import { Button } from "react-bootstrap";
import Archive2Modals from "./modals/archive2/Archive2Modals";
import CommonModals from "./modals/common/CommonModals";
import ModActionModals from "./modals/modActions/ModActionModals";
import ModDownloadModals from "./modals/modDownload/ModDownloadModals";
import ModInstallationModals from "./modals/modInstallation/ModInstallationModals";
import NexusModsModals from "./modals/nexusMods/NexusModsModals";
import ModDetails from "./ModDetails";
import ModTable from "./ModTable";
import StatusRow from "./StatusRow";
import ToolRow from "./ToolRow";

/** Controls whether the details side panel is shown */
const showDetailsAtom = atom(true);

export default function ModOrderTab() {
  const mods = useModsStore((store) => store.mods);
  const selectedModIndex = useModsStore((store) => store.getSelectedModIndex());
  const [showDetails, setShowDetails] = useAtom(showDetailsAtom);

  const { deployMods } = useModDeployment();

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
      {/* Modals */}
      <CommonModals />
      <ModInstallationModals />
      <ModActionModals />
      <ModDownloadModals />
      <Archive2Modals />
      <NexusModsModals />
    </>
  );
}
