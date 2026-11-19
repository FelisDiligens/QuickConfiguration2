import { MessageModal } from "@/components/modals/MessageModal";
import { modsEventBus } from "@/services/mods";
import { faCloudArrowDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Table } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { OutdatedMod } from "./NexusModsModals";

interface Props {
  show: boolean;
  onHide: () => void;
  outdatedMods?: OutdatedMod[] | null;
}

export default function OutdatedModsModal(props: Props) {
  const { t } = useTranslation();
  return (
    <MessageModal
      title={t("mods.modOrderTab.modals.outdatedModsModal.title")}
      show={props.show}
      onHide={props.onHide}
    >
      {props.outdatedMods && props.outdatedMods.length > 0 ? (
        <>
          <p>
            {t("mods.modOrderTab.modals.outdatedModsModal.modsOutdated", {
              count: props.outdatedMods.length,
            })}
          </p>
          <Table>
            <thead>
              <tr>
                <th>
                  {t(
                    "mods.modOrderTab.modals.outdatedModsModal.tableHeaderMod",
                  )}
                </th>
                <th>
                  {t(
                    "mods.modOrderTab.modals.outdatedModsModal.tableHeaderCurrentVersion",
                  )}
                </th>
                <th>
                  {t(
                    "mods.modOrderTab.modals.outdatedModsModal.tableHeaderLatestVersion",
                  )}
                </th>
                <th>
                  {t(
                    "mods.modOrderTab.modals.outdatedModsModal.tableHeaderActions",
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {(props.outdatedMods || []).map((mod) => (
                <tr key={mod.key}>
                  <td>{mod.title}</td>
                  <td>{mod.currentVersion}</td>
                  <td>{mod.latestVersion}</td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => {
                        props.onHide();
                        modsEventBus.emitNexusModsUpdateMod(mod.key);
                      }}
                    >
                      <FontAwesomeIcon icon={faCloudArrowDown} />
                      &nbsp;
                      {t(
                        "mods.modOrderTab.modals.outdatedModsModal.updateButton",
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      ) : (
        <p>{t("mods.modOrderTab.modals.outdatedModsModal.allUpToDate")}</p>
      )}
    </MessageModal>
  );
}
