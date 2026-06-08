import { commands } from "@/commands/bindings";
import PathEntryRow from "@/components/common/PathEntryRow";
import { useProfilesStore } from "@/stores/profiles";
import * as path from "@tauri-apps/api/path";
import { useEffect, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { useTranslation } from "react-i18next";

interface Props {
  show: boolean;
  onConfirm: (archiveName: string) => void;
  onAbort: () => void;
}

export default function AddResourceModal(props: Props) {
  const { t } = useTranslation();
  const [resource, setResource] = useState("");

  useEffect(() => {
    setResource("");
  }, [props.show]);

  return (
    <Modal show={props.show} backdrop="static" centered>
      <Modal.Header>
        <Modal.Title>
          {t("mods.resourceListTab.modals.addArchiveTitle")}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <PathEntryRow
          value={resource}
          type="open-file"
          filters={[
            {
              name: "Archive2",
              extensions: ["ba2"],
            },
          ]}
          onChange={(resourceName) => setResource(resourceName)}
          onChosen={(resourcePath) =>
            path.basename(resourcePath).then(setResource)
          }
          onValidate={async (resourceName) => {
            const dataPath = useProfilesStore.getState().getGameDataPath();
            if (!dataPath) return true;
            const resourcePath = await path.join(dataPath, resourceName);
            return await commands.isFile(resourcePath);
          }}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={() => props.onConfirm(resource)}>
          {t("common.saveButton")}
        </Button>
        <Button variant="secondary" onClick={props.onAbort}>
          {t("common.abort")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
