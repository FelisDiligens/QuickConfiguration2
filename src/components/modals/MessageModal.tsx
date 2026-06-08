import * as React from "react";
import { Button, Modal } from "react-bootstrap";
import { useTranslation } from "react-i18next";

interface Props {
  title: string;
  show: boolean;
  onHide: () => void;
  children: React.ReactNode;
}

export function MessageModal(props: Props) {
  const { t } = useTranslation();
  return (
    <Modal show={props.show} onHide={props.onHide} backdrop="static" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <b>{props.title}</b>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>{props.children}</Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={props.onHide}>
          {t("common.ok")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
