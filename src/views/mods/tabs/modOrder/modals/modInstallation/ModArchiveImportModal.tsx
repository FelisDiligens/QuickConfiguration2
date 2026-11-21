import { EntryRow, FlexCol, FlexRow } from "@/components/common";
import { ModalComponentProps } from "@/stores/modals";
import { animationsEnabled } from "@/utils";
import { css } from "@emotion/react";
import { faFileZipper } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import _ from "lodash";
import { useId, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Form,
  Modal,
} from "react-bootstrap";
import { useTranslation } from "react-i18next";

export interface ModArchiveImportModalData {
  archives: string[];
}

export interface ModArchiveImportModalResult {
  modName: string;
  archiveNames: string[];
}

export default function ModArchiveImportModal(
  props: ModalComponentProps<
    ModArchiveImportModalData,
    ModArchiveImportModalResult
  >,
) {
  const { t } = useTranslation();
  const [modName, setModName] = useState("");
  const [selectedArchives, setSelectedArchives] = useState<string[]>([]);

  function validateForm() {
    return !!modName.trim() && selectedArchives.length > 0;
  }

  function onCreate() {
    if (!validateForm()) return;
    props.close({ modName, archiveNames: selectedArchives });
  }

  return (
    <Modal
      size="xl"
      show={props.isOpen}
      onHide={props.cancel}
      animation={animationsEnabled}
      backdrop="static"
      centered
    >
      <Modal.Header>
        <b>{t("mods.modOrderTab.modals.importModal.title")}</b>
      </Modal.Header>
      <Modal.Body>
        <p>{t("mods.modOrderTab.modals.importModal.description")}</p>

        <FlexCol gap="1rem">
          <EntryRow
            floatingLabel={t("mods.modOrderTab.modals.importModal.modName")}
            value={modName}
            onChange={setModName}
            isInvalid={!modName.trim()}
          />

          <Card>
            <CardHeader>
              {t("mods.modOrderTab.modals.importModal.selectArchives")}
            </CardHeader>
            <CardBody>
              {props.data.archives.length == 0 && (
                <p>{t("mods.modOrderTab.modals.importModal.noArchives")}</p>
              )}
              {props.data.archives.map((archive) => (
                <FileCheckbox
                  key={archive}
                  name={archive}
                  enabled={selectedArchives.includes(archive)}
                  onChange={(name, enabled) => {
                    if (enabled) {
                      setSelectedArchives((prev) =>
                        _(prev).push(name).uniq().value(),
                      );
                    } else {
                      setSelectedArchives((prev) =>
                        _(prev).without(name).value(),
                      );
                    }
                  }}
                />
              ))}
            </CardBody>
          </Card>
        </FlexCol>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={onCreate} disabled={!validateForm()}>
          {t("mods.modOrderTab.modals.importModal.importButton")}
        </Button>
        <Button variant="secondary" onClick={props.cancel}>
          {t("common.cancel")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function FileCheckbox(props: {
  name: string;
  enabled: boolean;
  onChange: (name: string, enabled: boolean) => void;
}) {
  const id = useId();

  return (
    <FlexRow center gap="8px" css={css`margin-left: 8px;`}>
      {/* Checkbox, icon, and label */}
      <Form.Check id={id}>
        <Form.Check.Input
          checked={props.enabled}
          onChange={(ev) => props.onChange(props.name, ev.target.checked)}
        />
        <Form.Check.Label>
          <FontAwesomeIcon
            icon={faFileZipper}
            css={css`
              opacity: 0.7;
              margin-right: 4px;
            `}
          />
          <span>{props.name}</span>
        </Form.Check.Label>
      </Form.Check>
    </FlexRow>
  );
}
