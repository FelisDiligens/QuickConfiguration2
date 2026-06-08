import { FlexCol, FlexRow } from "@/components/common/Flex";
import { css } from "@emotion/react";
import { Button, Modal, ProgressBar, Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";

interface Props {
  show: boolean;
  onAbort?: () => void;
  progress?: number;
  label: string;
}

/**
 * A fullscreen modal that prevents interactions with the app.
 *
 * - The `progress` prop, if given, will display a progress bar with a percentage.
 *   It should be between 0 and 100. If `undefined`, the progress bar is hidden.
 * - The `onAbort` prop, if given, will display an "Abort" button that triggers
 *   the callback. If `undefined`, the button is hidden.
 */
export default function LoadingModal(props: Props) {
  const { t } = useTranslation();
  return (
    <Modal size="xl" show={props.show} backdrop="static" centered>
      <Modal.Body>
        <FlexRow center gap="1rem">
          <FlexCol noGrow noShrink>
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Pending...</span>
            </Spinner>
          </FlexCol>
          <FlexCol
            grow
            css={css`
              overflow: hidden;
              text-overflow: ellipsis;
            `}
          >
            {props.label}
          </FlexCol>
          {props.onAbort !== undefined && (
            <FlexCol>
              <Button variant="outline-danger" onClick={props.onAbort}>
                {t("common.abort")}
              </Button>
            </FlexCol>
          )}
        </FlexRow>
        {props.progress !== undefined && (
          <FlexRow
            css={css`
            margin-top: 20px;

            & > .progress {
              width: 100%;
            }
          `}
          >
            <ProgressBar
              now={Math.round(props.progress)}
              label={`${Math.round(props.progress)}%`}
            />
          </FlexRow>
        )}
      </Modal.Body>
    </Modal>
  );
}
