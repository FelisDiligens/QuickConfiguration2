import { MessageModal } from "@/components/modals/MessageModal";
import { ModalComponentProps } from "@/stores/modals";
import { ExtendedArchive2Info } from "@/hooks/mods";
import { formatBytes } from "@/utils";
import { css } from "@emotion/react";
import { Table } from "react-bootstrap";
import { useTranslation } from "react-i18next";

export interface Archive2InfoModalData {
  info?: ExtendedArchive2Info | null;
}

export default function Archive2InfoModal(
  props: ModalComponentProps<Archive2InfoModalData, void>,
) {
  const { t } = useTranslation();
  return (
    <MessageModal
      isOpen={props.isOpen}
      data={{
        title: t("mods.modOrderTab.modals.archive2.infoTitle"),
        children: (
          <Table>
            <tbody>
              <tr>
                <td>{t("mods.modOrderTab.modals.archive2.filePath")}</td>
                <td css={css`word-break: break-all;`}>
                  {props.data.info?.filePath}
                </td>
              </tr>
              <tr>
                <td>{t("mods.modOrderTab.modals.archive2.fileSize")}</td>
                <td>
                  {props.data.info?.fileSize != null
                    ? formatBytes(props.data.info?.fileSize)
                    : "-/-"}
                </td>
              </tr>
              <tr>
                <td>{t("mods.modOrderTab.modals.archive2.format")}</td>
                <td>{props.data.info?.format}</td>
              </tr>
              <tr>
                <td>{t("mods.modOrderTab.modals.archive2.compression")}</td>
                <td>{props.data.info?.compression}</td>
              </tr>
              <tr>
                <td>{t("mods.modOrderTab.modals.archive2.numOfFiles")}</td>
                <td>{props.data.info?.numOfFiles}</td>
              </tr>
            </tbody>
          </Table>
        ),
      }}
      close={props.cancel}
      cancel={props.cancel}
    />
  );
}
