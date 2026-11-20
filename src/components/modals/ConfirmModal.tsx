import { ModalComponentProps } from "@/stores/modals";
import { animationsEnabled } from "@/utils";
import { ReactNode } from "react";
import { Button, Modal } from "react-bootstrap";
import { useTranslation } from "react-i18next";

export interface ConfirmModalData {
  title: string;
  children?: ReactNode;
}

export function ConfirmModal(
  props: ModalComponentProps<ConfirmModalData, boolean>,
) {
  const { t } = useTranslation();
  return (
    <Modal
      show={props.isOpen}
      onHide={props.cancel}
      backdrop="static"
      centered
      animation={animationsEnabled}
    >
      <Modal.Header>
        <Modal.Title>{props.data.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{props.data.children}</Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={() => props.close(true)}>
          {t("common.yes")}
        </Button>
        <Button variant="secondary" onClick={props.cancel}>
          {t("common.no")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
