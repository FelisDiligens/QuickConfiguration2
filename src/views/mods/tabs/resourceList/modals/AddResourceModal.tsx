import { commands } from "@/commands/bindings";
import { PathEntryRow } from "@/components/common";
import { ModalComponentProps } from "@/stores/modals";
import { useProfilesStore } from "@/stores/profiles";
import { animationsEnabled } from "@/utils";
import * as path from "@tauri-apps/api/path";
import { useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { useTranslation } from "react-i18next";

export default function AddResourceModal(
  props: ModalComponentProps<void, string>,
) {
  const { t } = useTranslation();
  const [resource, setResource] = useState("");

  return (
    <Modal
      show={props.isOpen}
      onHide={props.cancel}
      animation={animationsEnabled}
      backdrop="static"
      centered
    >
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
        <Button variant="primary" onClick={() => props.close(resource)}>
          {t("common.saveButton")}
        </Button>
        <Button variant="secondary" onClick={props.cancel}>
          {t("common.abort")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
