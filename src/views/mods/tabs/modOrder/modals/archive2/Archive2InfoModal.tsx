import { MessageModal } from "@/components/modals/MessageModal";
import { ExtendedArchive2Info } from "@/hooks/mods";
import { formatBytes } from "@/utils";
import { css } from "@emotion/react";
import { Table } from "react-bootstrap";
import { useTranslation } from "react-i18next";

interface Props {
  show: boolean;
  onHide: () => void;
  info?: ExtendedArchive2Info | null;
}

export default function Archive2InfoModal(props: Props) {
  const { t } = useTranslation();
  return (
    <MessageModal
      title={t("mods.modOrderTab.modals.archive2.infoTitle")}
      show={props.show}
      onHide={props.onHide}
    >
      <Table>
        <tbody>
          <tr>
            <td>{t("mods.modOrderTab.modals.archive2.filePath")}</td>
            <td css={css`word-break: break-all;`}>{props.info?.filePath}</td>
          </tr>
          <tr>
            <td>{t("mods.modOrderTab.modals.archive2.fileSize")}</td>
            <td>
              {props.info?.fileSize != null
                ? formatBytes(props.info?.fileSize)
                : "-/-"}
            </td>
          </tr>
          <tr>
            <td>{t("mods.modOrderTab.modals.archive2.format")}</td>
            <td>{props.info?.format}</td>
          </tr>
          <tr>
            <td>{t("mods.modOrderTab.modals.archive2.compression")}</td>
            <td>{props.info?.compression}</td>
          </tr>
          <tr>
            <td>{t("mods.modOrderTab.modals.archive2.numOfFiles")}</td>
            <td>{props.info?.numOfFiles}</td>
          </tr>
        </tbody>
      </Table>
    </MessageModal>
  );
}
