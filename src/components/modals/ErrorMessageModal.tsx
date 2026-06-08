import { AnyError, commandErrorToString } from "@/commands/errors";
import { Button, Modal } from "react-bootstrap";
import { useTranslation } from "react-i18next";

interface Props {
  show: boolean;
  onHide: () => void;
  reason: AnyError;
}

/**
 * A modal that shows an error message.
 */
export default function ErrorMessageModal(props: Props) {
  const { t } = useTranslation();
  return (
    <Modal
      size="xl"
      show={props.show}
      onHide={props.onHide}
      backdrop="static"
      centered
    >
      <Modal.Header>
        <b>{t("errors.anErrorOccurred")}</b>
      </Modal.Header>
      <Modal.Body>
        <span>{commandErrorToString(props.reason)}</span>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={props.onHide}>
          {t("common.ok")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
