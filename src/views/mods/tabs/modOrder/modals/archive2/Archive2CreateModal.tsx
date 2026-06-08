import {
  Archive2Compression,
  Archive2Format,
  commands,
} from "@/commands/bindings";
import ComboRow from "@/components/common/ComboRow";
import PathEntryRow from "@/components/common/PathEntryRow";
import { useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { useTranslation } from "react-i18next";

interface Props {
  show: boolean;
  onHide: () => void;
  onCreate: (
    archivePath: string,
    sourcePath: string,
    format: Archive2Format,
    compression: Archive2Compression,
  ) => void;
}

export default function Archive2CreateModal(props: Props) {
  const { t } = useTranslation();
  const [archivePath, setArchivePath] = useState("");
  const [sourcePath, setSourcePath] = useState("");
  const [format, setFormat] = useState<Archive2Format>("General");
  const [compression, setCompression] =
    useState<Archive2Compression>("Default");

  async function validateArchivePath(archivePath: string) {
    if (!archivePath.toLocaleLowerCase().endsWith(".ba2")) return false;
    return true;
  }

  async function validateSourcePath(sourcePath: string) {
    return await commands.isDirectory(sourcePath);
  }

  async function validateForm() {
    return (
      (await validateArchivePath(archivePath)) &&
      (await validateSourcePath(sourcePath))
    );
  }

  function onCreate() {
    validateForm()
      .then(() => props.onCreate(archivePath, sourcePath, format, compression))
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
        <b>{t("mods.modOrderTab.modals.archive2.createTitle")}</b>
      </Modal.Header>
      <Modal.Body>
        <PathEntryRow
          title={t("mods.modOrderTab.modals.archive2.createArchivePath")}
          value={archivePath}
          type="save-file"
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
          title={t("mods.modOrderTab.modals.archive2.sourceFolderPath")}
          value={sourcePath}
          onChange={setSourcePath}
          onValidate={validateSourcePath}
        />
        <ComboRow
          title={t("mods.modOrderTab.modals.archive2.format")}
          value={format}
          onChange={(format) => setFormat(format as Archive2Format)}
        >
          <option value="General">
            {t("mods.modOrderTab.modals.archive2.formatOptions.General")}
          </option>
          <option value="DDS">
            {t("mods.modOrderTab.modals.archive2.formatOptions.DDS")}
          </option>
          <option value="XBoxDDS">
            {t("mods.modOrderTab.modals.archive2.formatOptions.XBoxDDS")}
          </option>
          <option value="GNF">
            {t("mods.modOrderTab.modals.archive2.formatOptions.GNF")}
          </option>
        </ComboRow>
        <ComboRow
          title={t("mods.modOrderTab.modals.archive2.compression")}
          value={compression}
          onChange={(compression) =>
            setCompression(compression as Archive2Compression)
          }
        >
          <option value="Default">
            {t("mods.modOrderTab.modals.archive2.compressionOptions.Default")}
          </option>
          <option value="XBox">
            {t("mods.modOrderTab.modals.archive2.compressionOptions.XBox")}
          </option>
          <option value="None">
            {t("mods.modOrderTab.modals.archive2.compressionOptions.None")}
          </option>
        </ComboRow>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={onCreate}>
          {t("mods.modOrderTab.modals.archive2.createButton")}
        </Button>
        <Button variant="secondary" onClick={props.onHide}>
          {t("common.cancel")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
