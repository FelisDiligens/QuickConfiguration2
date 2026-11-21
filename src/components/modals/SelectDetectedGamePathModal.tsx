import { commands } from "@/commands/bindings";
import { ErrorAlert, LoadingAlert, Select } from "@/components/common";
import { useAsync } from "@/hooks/async";
import { ModalComponentProps } from "@/stores/modals";
import { animationsEnabled } from "@/utils";
import { css } from "@emotion/react";
import { useState } from "react";
import { Alert, Button, Modal } from "react-bootstrap";
import { useTranslation } from "react-i18next";

export default function SelectDetectedGamePathModal(
  props: ModalComponentProps<void, string>,
) {
  const { t } = useTranslation();

  const { data: paths, isPending, error } = useAsync(commands.detectGamePath);
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <Modal
      show={props.isOpen}
      onHide={props.cancel}
      animation={animationsEnabled}
      backdrop="static"
      centered
    >
      <Modal.Header>
        <Modal.Title>{t("profiles.autoDetectGamePathModal.title")}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {isPending && <LoadingAlert>{t("common.loading")}</LoadingAlert>}
        {error && <ErrorAlert reason={error} />}
        {paths &&
          (paths.length > 0 ? (
            <>
              <p>{t("profiles.autoDetectGamePathModal.text")}</p>
              <Select
                label={t("profiles.autoDetectGamePathModal.selectGamePath")}
                onChange={(value) => setSelectedIndex(parseInt(value))}
              >
                {paths.map((path, index) => (
                  <option key={index} value={index}>
                    {path}
                  </option>
                ))}
              </Select>
            </>
          ) : (
            <Alert>{t("profiles.autoDetectGamePathModal.noPathsFound")}</Alert>
          ))}
      </Modal.Body>
      <Modal.Footer>
        {paths && paths.length > 0 && (
          <Button
            variant="primary"
            disabled={isPending || !!error}
            onClick={() => props.close(paths[selectedIndex])}
            css={css`
            padding-left: 20px;
            padding-right: 20px;
          `}
          >
            {t("profiles.autoDetectGamePathModal.selectButton")}
          </Button>
        )}
        <Button
          variant="secondary"
          onClick={props.cancel}
          css={css`
            padding-left: 20px;
            padding-right: 20px;
          `}
        >
          {t("profiles.autoDetectGamePathModal.closeButton")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
