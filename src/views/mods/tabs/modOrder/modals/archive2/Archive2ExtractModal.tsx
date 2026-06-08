import { commands } from "@/commands/bindings";
import PathEntryRow from "@/components/common/PathEntryRow";
import { useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { useTranslation } from "react-i18next";

interface Props {
  show: boolean;
  onHide: () => void;
  onExtract: (archivePath: string, destinationPath: string) => void;
}

export default function Archive2ExtractModal(props: Props) {
  const { t } = useTranslation();
  const [archivePath, setArchivePath] = useState("");
  const [destinationPath, setDestinationPath] = useState("");

  async function validateArchivePath(archivePath: string) {
    if (!(await commands.isFile(archivePath))) return false;
    if (!archivePath.toLocaleLowerCase().endsWith(".ba2")) return false;
    return true;
  }

  async function validateDestinationPath(destinationPath: string) {
    return await commands.isDirectory(destinationPath);
  }

  async function validateForm() {
    return (
      (await validateArchivePath(archivePath)) &&
      (await validateDestinationPath(destinationPath))
    );
  }

  function onExtract() {
    validateForm()
      .then(() => props.onExtract(archivePath, destinationPath))
      .catch(console.error);
  }

  return (
    <Modal
      size="xl"
      show={props.show}
      onHide={props.onHide}
      backdrop="static"
      centered
    >
      <Modal.Header>
        <b>{t("mods.modOrderTab.modals.archive2.extractTitle")}</b>
      </Modal.Header>
      <Modal.Body>
        <PathEntryRow
          title={t("mods.modOrderTab.modals.archive2.extractArchivePath")}
          value={archivePath}
          type="open-file"
          filters={[
            {
              name: "Archive2",
              extensions: ["ba2"],
            },
          ]}
          onChange={setArchivePath}
          onValidate={validateArchivePath}
        />
        <PathEntryRow
          title={t("mods.modOrderTab.modals.archive2.extractToFolderPath")}
          value={destinationPath}
          onChange={setDestinationPath}
          onValidate={validateDestinationPath}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={onExtract}>
          {t("mods.modOrderTab.modals.archive2.extractButton")}
        </Button>
        <Button variant="secondary" onClick={props.onHide}>
          {t("common.cancel")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
