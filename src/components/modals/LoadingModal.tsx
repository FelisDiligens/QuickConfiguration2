import { FlexCol, FlexRow } from "@/components/common";
import { ModalComponentProps } from "@/stores/modals";
import { animationsEnabled } from "@/utils";
import { css } from "@emotion/react";
import { Button, Modal, ProgressBar, Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";

/**
 * Data for the {@link LoadingModal}:
 * - `progress`, if given, displays a progress bar with a percentage (0-100).
 *   If `undefined`, the progress bar is hidden.
 * - `onAbort`, if given, displays an "Abort" button that triggers the callback.
 *   If `undefined`, the button is hidden.
 */
export interface LoadingModalData {
  label: string;
  progress?: number;
  onAbort?: () => void;
}

/**
 * A fullscreen modal that prevents interactions with the app.
 */
export default function LoadingModal(
  props: ModalComponentProps<LoadingModalData, void>,
) {
  const { t } = useTranslation();
  return (
    <Modal
      size="xl"
      show={props.isOpen}
      animation={animationsEnabled}
      backdrop="static"
      centered
    >
      <Modal.Body>
        <FlexRow center gap="1rem">
          <FlexCol noGrow noShrink>
            <Spinner animation="border" role="status">
              <span className="visually-hidden">{t("common.loading")}</span>
            </Spinner>
          </FlexCol>
          <FlexCol
            grow
            css={css`
              overflow: hidden;
              text-overflow: ellipsis;
            `}
          >
            {props.data.label}
          </FlexCol>
          {props.data.onAbort !== undefined && (
            <FlexCol>
              <Button variant="outline-danger" onClick={props.data.onAbort}>
                {t("common.abort")}
              </Button>
            </FlexCol>
          )}
        </FlexRow>
        {props.data.progress !== undefined && (
          <FlexRow
            css={css`
            margin-top: 20px;

            & > .progress {
              width: 100%;
            }
          `}
          >
            <ProgressBar
              now={Math.round(props.data.progress)}
              label={`${Math.round(props.data.progress)}%`}
            />
          </FlexRow>
        )}
      </Modal.Body>
    </Modal>
  );
}
