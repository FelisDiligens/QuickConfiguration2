import * as React from "react";
import { Button, Modal } from "react-bootstrap";
import { useTranslation } from "react-i18next";

interface Props {
  title: string;
  show: boolean;
  onConfirm: () => void;
  onAbort: () => void;
  children: React.ReactNode;
}

export function ConfirmModal(props: Props) {
  const { t } = useTranslation();
  return (
    <Modal show={props.show} backdrop="static" centered>
      <Modal.Header>
        <Modal.Title>{props.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{props.children}</Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={props.onConfirm}>
          {t("common.yes")}
        </Button>
        <Button variant="secondary" onClick={props.onAbort}>
          {t("common.no")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
