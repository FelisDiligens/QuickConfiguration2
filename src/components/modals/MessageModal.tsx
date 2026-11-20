import { ModalComponentProps } from "@/stores/modals";
import { ReactNode } from "react";
import { Button, Modal } from "react-bootstrap";
import { useTranslation } from "react-i18next";

export interface MessageModalData {
  title: string;
  children?: ReactNode;
}

export function MessageModal(
  props: ModalComponentProps<MessageModalData, void>,
) {
  const { t } = useTranslation();
  return (
    <Modal show={props.isOpen} onHide={props.cancel} backdrop="static" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <b>{props.data.title}</b>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>{props.data.children}</Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={() => props.close()}>
          {t("common.ok")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
