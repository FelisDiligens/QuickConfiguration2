import { commands } from "@/commands/bindings";
import { PathEntryRow } from "@/components/common";
import { ModalComponentProps } from "@/stores/modals";
import { useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { useTranslation } from "react-i18next";

export interface Archive2ExtractResult {
  archivePath: string;
  destinationPath: string;
}

export default function Archive2ExtractModal(
  props: ModalComponentProps<void, Archive2ExtractResult>,
) {
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
      .then(() => props.close({ archivePath, destinationPath }))
      .catch(console.error);
  }

  return (
    <Modal
      size="xl"
      show={props.isOpen}
      onHide={props.cancel}
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
        <Button variant="secondary" onClick={props.cancel}>
          {t("common.cancel")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
