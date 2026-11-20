import { commands } from "@/commands/bindings";
import { PathEntryRow } from "@/components/common";
import { useProfilesStore } from "@/stores/profiles";
import { ModalComponentProps } from "@/stores/modals";
import { useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { useTranslation } from "react-i18next";

export interface Archive2AutoPackResult {
  modName: string;
  sourcePath: string;
  destinationPath: string;
  tempPath: string;
}

export default function Archive2AutoPackModal(
  props: ModalComponentProps<void, Archive2AutoPackResult>,
) {
  const { t } = useTranslation();
  const getTmpPath = useProfilesStore((s) => s.getModsTmpPath);
  const [sourcePath, setSourcePath] = useState("");
  const [destinationPath, setDestinationPath] = useState("");

  async function validateSourcePath(sourcePath: string) {
    return await commands.isDirectory(sourcePath);
  }

  async function validateDestinationPath(sourcePath: string) {
    return await commands.isDirectory(sourcePath);
  }

  async function validateForm() {
    return (
      (await validateSourcePath(sourcePath)) &&
      (await validateDestinationPath(destinationPath))
    );
  }

  function onCreate() {
    const tmpPath = getTmpPath();
    if (!tmpPath) {
      console.error("Temporary path could not be determined");
      return;
    }
    validateForm()
      .then(() =>
        props.close({
          modName: "Bundled",
          sourcePath,
          destinationPath,
          tempPath: tmpPath,
        }),
      )
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
        <b>{t("mods.modOrderTab.modals.archive2.autoPackTitle")}</b>
      </Modal.Header>
      <Modal.Body>
        <p>{t("mods.modOrderTab.modals.archive2.autoPackDescription")}</p>
        <PathEntryRow
          title={t("mods.modOrderTab.modals.archive2.sourceFolderPath")}
          value={sourcePath}
          onChange={setSourcePath}
          onValidate={validateSourcePath}
        />
        <PathEntryRow
          title={t("mods.modOrderTab.modals.archive2.destinationFolderPath")}
          value={destinationPath}
          onChange={setDestinationPath}
          onValidate={validateDestinationPath}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={onCreate}>
          {t("mods.modOrderTab.modals.archive2.autoPackButton")}
        </Button>
        <Button variant="secondary" onClick={props.cancel}>
          {t("common.cancel")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
