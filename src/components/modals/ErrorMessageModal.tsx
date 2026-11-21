import { AnyError, commandErrorToString } from "@/commands/errors";
import { ModalComponentProps } from "@/stores/modals";
import { animationsEnabled } from "@/utils";
import { Button, Modal } from "react-bootstrap";
import { useTranslation } from "react-i18next";

export interface ErrorMessageModalData {
  reason: AnyError;
}

/**
 * A modal that shows an error message.
 */
export default function ErrorMessageModal(
  props: ModalComponentProps<ErrorMessageModalData, void>,
) {
  const { t } = useTranslation();
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
        <Modal.Title>{t("errors.anErrorOccurred")}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <span>{commandErrorToString(props.data.reason)}</span>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={() => props.close()}>
          {t("common.ok")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
